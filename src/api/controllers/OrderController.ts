import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import OrderService from '../services/OrderService';
import orderService, { CancelOrderResultCode } from '../services/OrderService';
import httpStatus from 'http-status';
import { Pagination } from '../../utils/helper/pagination';
import { ProductAttribute } from '.prisma/client';
import {
  OrderRevokeInvoiceStatus,
  OrderRevokeLogisticsStatus,
  OrderRevokePaymentStatus,
  OrderStatus,
} from '@prisma/client';
import OneWarehouseClient from '../../utils/one-warehouse/client';
import BonusPointService from '../services/BonusPointService';
import PaymentService from '../services/PaymentService';
import {
  LogisticsDetail,
  Order,
  OrderDetail,
  OrderDetailsIncludesCoverImg,
  OrderRevokeInformation,
} from '../models/Order';

const idSchema = string().required();

type GetManyByAttributeQuery = Pagination & { attribute?: ProductAttribute };

const getManyByAttributeSchema: ObjectSchema<GetManyByAttributeQuery> = object({
  attribute: string()
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .optional(),
  take: number().min(0).max(200).default(10).optional(),
  skip: number().min(0).default(0).optional(),
});

interface UpdateOrderStatusBody {
  orderStatus: OrderStatus;
}

const updateOrderStatusSchema: ObjectSchema<UpdateOrderStatusBody> = object({
  orderStatus: string()
    .oneOf([
      OrderStatus.WAIT_PAYMENT,
      OrderStatus.WAIT_DELIVER,
      OrderStatus.WAIT_RECEIVE,
      OrderStatus.COMPLETED,
    ])
    .required(),
});

interface UpdateRevokeInvoiceStatusBody {
  invoiceStatus: OrderRevokeInvoiceStatus;
}

const updateRevokeInvoiceStatusSchema: ObjectSchema<UpdateRevokeInvoiceStatusBody> =
  object({
    invoiceStatus: string()
      .oneOf([
        OrderRevokeInvoiceStatus.UNISSUED,
        OrderRevokeInvoiceStatus.WAIT_CANCEL,
        OrderRevokeInvoiceStatus.CANCELLED,
      ])
      .required(),
  });
interface UpdateRevokePaymentStatusBody {
  paymentStatus: OrderRevokePaymentStatus;
}

const updateRevokePaymentStatusSchema: ObjectSchema<UpdateRevokePaymentStatusBody> =
  object({
    paymentStatus: string()
      .oneOf([
        OrderRevokePaymentStatus.UNPAIED,
        OrderRevokePaymentStatus.WAIT_REFUND,
        OrderRevokePaymentStatus.REFUNDED,
      ])
      .required(),
  });
interface UpdateRevokeLogisticsStatusBody {
  logisticsStatus: OrderRevokeLogisticsStatus;
}

const updateRevokeLogisticsStatusSchema: ObjectSchema<UpdateRevokeLogisticsStatusBody> =
  object({
    logisticsStatus: string()
      .oneOf([
        OrderRevokeLogisticsStatus.WAIT_CANCEL,
        OrderRevokeLogisticsStatus.CANCELLED,
      ])
      .required(),
  });

class OrderController {
  async getMany(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let getManyByAttributeQuery: GetManyByAttributeQuery;
    try {
      // Note: Check request query is valid
      getManyByAttributeQuery = await getManyByAttributeSchema.validate(
        req.query,
      );
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { role, id: userId } = req.userdata;
      const orders = await OrderService.getOrders({
        attribute: getManyByAttributeQuery.attribute,
        pagination: {
          ...getManyByAttributeQuery,
        },
        restrict:
          role === 'USER'
            ? {
                userId,
              }
            : undefined,
      });

      const responseData: Order[] = orders.map((order) => ({
        id: order.id,
        orderStatus: order.orderStatus,
        attribute: order.attribute,
        price: order.price,
        createdAt: order.createdAt,
      }));

      res.status(httpStatus.OK).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }

  async getOrderDetailIncludesCoverImg(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } = await OrderController.validateId(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { role, id: userId } = req.userdata;
      const orderDetail =
        await OrderService.getOrderDetailIncludesCoverImagePathById({
          id: data.id,
          restrict:
            role === 'USER'
              ? {
                  userId,
                }
              : undefined,
        });
      if (!orderDetail) {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
        return;
      }
      if (!orderDetail.consignee) {
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
        return;
      }
      const responseData: OrderDetailsIncludesCoverImg = {
        id: orderDetail.id,
        orderStatus: orderDetail.orderStatus,
        attribute: orderDetail.attribute,
        price: orderDetail.price,
        createdAt: orderDetail.createdAt,
        consignee: {
          deliveryType: orderDetail.consignee.deliveryType,
          name: orderDetail.consignee.name,
          email: orderDetail.consignee.email,
          cellphone: orderDetail.consignee.cellphone,
          addressDetailOne: orderDetail.consignee.addressDetailOne,
          addressDetailTwo: orderDetail.consignee.addressDetailTwo,
          province: orderDetail.consignee.province,
          city: orderDetail.consignee.city,
          district: orderDetail.consignee.district,
          town: orderDetail.consignee.town,
          zipCode: orderDetail.consignee.zipCode,
          remark: orderDetail.consignee.remark,
          stationCode: orderDetail.consignee.stationCode,
          stationName: orderDetail.consignee.stationName,
          senderRemark: orderDetail.consignee.senderRemark,
        },
        items: orderDetail.orderItems.map((item) => ({
          productId: item.productId,
          skuId: item.productSkuId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          coverImg: item.productFromId?.coverImagePath || null,
        })),
      };
      res.status(httpStatus.OK).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }

  async getManyDetails(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let getManyByAttributeQuery: GetManyByAttributeQuery;
    try {
      // Note: Check request query is valid
      getManyByAttributeQuery = await getManyByAttributeSchema.validate(
        req.query,
      );
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const orderDetails = await OrderService.getOrderDetails({
        attribute: getManyByAttributeQuery.attribute,
        pagination: {
          ...getManyByAttributeQuery,
        },
      });

      const responseData: OrderDetail[] = [];
      let failed = false;
      orderDetails.every((orderDetail) => {
        if (!orderDetail.consignee) {
          failed = true;
          return false;
        }
        return responseData.push({
          id: orderDetail.id,
          orderStatus: orderDetail.orderStatus,
          attribute: orderDetail.attribute,
          price: orderDetail.price,
          createdAt: orderDetail.createdAt,
          consignee: {
            deliveryType: orderDetail.consignee.deliveryType,
            name: orderDetail.consignee.name,
            email: orderDetail.consignee.email,
            cellphone: orderDetail.consignee.cellphone,
            addressDetailOne: orderDetail.consignee.addressDetailOne,
            addressDetailTwo: orderDetail.consignee.addressDetailTwo,
            province: orderDetail.consignee.province,
            city: orderDetail.consignee.city,
            district: orderDetail.consignee.district,
            town: orderDetail.consignee.town,
            zipCode: orderDetail.consignee.zipCode,
            remark: orderDetail.consignee.remark,
            stationCode: orderDetail.consignee.stationCode,
            stationName: orderDetail.consignee.stationName,
            senderRemark: orderDetail.consignee.senderRemark,
          },
          items: orderDetail.orderItems.map((item) => ({
            productId: item.productId,
            skuId: item.productSkuId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        });
      });

      if (failed) {
        res
          .send(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Any Order includes a null consignee' });
      }
      res.status(httpStatus.OK).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }

  static async validateId(req: Request): Promise<
    | {
        result: 'ok';
        data: { id: string };
        err: undefined;
      }
    | { result: 'error'; data: undefined; err: unknown }
  > {
    try {
      // Note: Check params is valid
      const id = await idSchema.validate(req.params.id);
      return {
        result: 'ok',
        data: {
          id,
        },
        err: undefined,
      };
    } catch (err) {
      return {
        result: 'error',
        data: undefined,
        err,
      };
    }
  }

  async updateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } = await OrderController.validateId(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    let updateOrderStatusBody: UpdateOrderStatusBody;
    try {
      // Note: Check request body is valid
      updateOrderStatusBody = await updateOrderStatusSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const order = await OrderService.setOrderStatus({
        id: data.id,
        orderStatus: updateOrderStatusBody.orderStatus,
      });
      if (!order) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }

      const responseData: Order = {
        id: order.id,
        orderStatus: order.orderStatus,
        attribute: order.attribute,
        price: order.price,
        createdAt: order.createdAt,
      };

      res.status(httpStatus.OK).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { result, data, err } = await OrderController.validateId(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const { role, id: userId } = req.userdata;
      // Note: Check order exist (or user has the right to access the order)
      const order = await orderService.getOrderById({
        id: data.id,
        restrict:
          role === 'USER'
            ? {
                userId,
              }
            : undefined,
      });

      if (!order) {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
        return;
      }

      // Note: 訂單已取消
      if (order.orderStatus === OrderStatus.CANCELLED) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: 'Order has been cancelled.',
        });
        return;
      }

      // Note: 訂單已進入退貨退款程序
      if (order.orderStatus === OrderStatus.REVOKED) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: 'Order has been revoked.',
        });
        return;
      }

      // Note: 訂單等待付款
      if (order.orderStatus === OrderStatus.WAIT_PAYMENT) {
        const result = await orderService.cancelOrderFromWaitPayment(data);
        try {
          if (order.bonusPointRedemptionId) {
            await BonusPointService.cancelRedemption(
              order.bonusPointRedemptionId,
            );
          }
        } catch (err) {
          // bonus point record not found
        }
        if (result.code === CancelOrderResultCode.SUCCESS) {
          res.sendStatus(httpStatus.ACCEPTED);
        } else {
          res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
        }
        return;
      }

      // Note: 訂單完成付款，等待出貨
      if (order.orderStatus === OrderStatus.WAIT_DELIVER) {
        // Note: 修改訂單狀態
        const result = await orderService.revokeOrderFromWaitDelivery(data);
        // TODO:
        //  後續行為
        //  (1) 綠界退款
        //  (2) 作廢發票
        //  (3) 取消物流 (手動，不實作）
        try {
          if (order.bonusPointRedemptionId) {
            await BonusPointService.cancelRedemption(
              order.bonusPointRedemptionId,
            );
          }
        } catch (err) {
          // bonus point record not found
        }
        if (result.code === CancelOrderResultCode.SUCCESS) {
          res.sendStatus(httpStatus.ACCEPTED);
        } else {
          res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
        }
        return;
      }

      // Note: 訂單已完成
      if (order.orderStatus === OrderStatus.COMPLETED) {
        res.status(httpStatus.BAD_REQUEST).json({
          message:
            'Order has completed. The order cannot be canceled at this time.' +
            'Please contact our customer service staff for effective assistance.',
        });
        return;
      }

      return;
    } catch (err) {
      next(err);
    }
  }

  async cancelInvoice(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } = await OrderController.validateId(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const orderData = await OrderService.getOrderRevokeInformationById(data);
      if (!orderData) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }
      const { revokeInformation } = orderData;
      if (
        !revokeInformation ||
        revokeInformation.invoiceStatus !== OrderRevokeInvoiceStatus.WAIT_CANCEL
      ) {
        res.status(httpStatus.BAD_REQUEST).json({
          message:
            'The invoice cancellation of this order cannot be processed.',
        });
        return;
      }

      await PaymentService.cancelInvoice({ orderId: data.id });
      res.sendStatus(httpStatus.ACCEPTED);
    } catch (err) {
      next(err);
    }
  }

  async getLogisticsDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } = await OrderController.validateId(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const { role, id: userId } = req.userdata;
      // Note: Check order exist (or user has the right to access the order)
      const order = await orderService.getOrderById({
        id: data.id,
        restrict:
          role === 'USER'
            ? {
                userId,
              }
            : undefined,
      });

      if (!order) {
        res.status(httpStatus.BAD_REQUEST).json({ message: 'Id is invalid.' });
        return;
      }

      const response = await OneWarehouseClient.detail({
        order_no: data.id,
        timestamp: Date.now().toString(),
      });

      const logisticsDetail: LogisticsDetail = {
        id: response.order_no,
        outboundOrderId: response.outbound_order_no,
        outboundTime: response.outbound_time
          ? new Date(response.outbound_time)
          : null,
        logisticsStatus: response.logistics_status,
        packageInfos: response.package_infos.map((info) => ({
          logisticsNo: info.logistics_no,
          expressNo: info.express_no,
          providerLogisticsCode: info.provider_logistics_code,
          deliveryType: info.delivery_type === 'home' ? 'HOME' : 'STORE',
        })),
      };

      res.status(httpStatus.OK).json({ data: logisticsDetail });
    } catch (err) {
      next(err);
    }
  }

  async getRevokeInformation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } = await OrderController.validateId(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const orderData = await OrderService.getOrderRevokeInformationById(data);
      if (!orderData || !orderData.revokeInformation) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }
      const { revokeInformation } = orderData;

      const responseData: OrderRevokeInformation = {
        id: orderData.id,
        revokeInformation: {
          invoiceStatus: revokeInformation.invoiceStatus,
          paymentStatus: revokeInformation.paymentStatus,
          logisticsStatus: revokeInformation.logisticsStatus,
        },
      };

      res.status(httpStatus.OK).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRevokeInvoiceStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } = await OrderController.validateId(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    let updateRevokeInvoiceStatusBody: UpdateRevokeInvoiceStatusBody;
    try {
      // Note: Check request body is valid
      updateRevokeInvoiceStatusBody =
        await updateRevokeInvoiceStatusSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const revokeInformation = await OrderService.setOrderRevokeInvoiceStatus({
        id: data.id,
        invoiceStatus: updateRevokeInvoiceStatusBody.invoiceStatus,
      });
      if (!revokeInformation) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }

      const responseData: OrderRevokeInformation = {
        id: data.id,
        revokeInformation: {
          invoiceStatus: revokeInformation.invoiceStatus,
          paymentStatus: revokeInformation.paymentStatus,
          logisticsStatus: revokeInformation.logisticsStatus,
        },
      };

      res.status(httpStatus.OK).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
  async updateRevokePaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } = await OrderController.validateId(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    let updateRevokePaymentStatusBody: UpdateRevokePaymentStatusBody;
    try {
      // Note: Check request body is valid
      updateRevokePaymentStatusBody =
        await updateRevokePaymentStatusSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const revokeInformation = await OrderService.setOrderRevokePaymentStatus({
        id: data.id,
        paymentStatus: updateRevokePaymentStatusBody.paymentStatus,
      });
      if (!revokeInformation) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }

      const responseData: OrderRevokeInformation = {
        id: data.id,
        revokeInformation: {
          invoiceStatus: revokeInformation.invoiceStatus,
          paymentStatus: revokeInformation.paymentStatus,
          logisticsStatus: revokeInformation.logisticsStatus,
        },
      };

      res.status(httpStatus.OK).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
  async updateRevokeLogisticsStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { result, data, err } = await OrderController.validateId(req);
    if (result === 'error') {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    let updateRevokeLogisticsStatusBody: UpdateRevokeLogisticsStatusBody;
    try {
      // Note: Check request body is valid
      updateRevokeLogisticsStatusBody =
        await updateRevokeLogisticsStatusSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const revokeInformation =
        await OrderService.setOrderRevokeLogisticsStatus({
          id: data.id,
          logisticsStatus: updateRevokeLogisticsStatusBody.logisticsStatus,
        });
      if (!revokeInformation) {
        res.status(httpStatus.NOT_FOUND).json({ message: 'Id is invalid.' });
        return;
      }

      const responseData: OrderRevokeInformation = {
        id: data.id,
        revokeInformation: {
          invoiceStatus: revokeInformation.invoiceStatus,
          paymentStatus: revokeInformation.paymentStatus,
          logisticsStatus: revokeInformation.logisticsStatus,
        },
      };

      res.status(httpStatus.OK).json({
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new OrderController();
