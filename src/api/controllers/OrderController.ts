import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import OrderService from '../services/OrderService';
import orderService, { CancelOrderResultCode } from '../services/OrderService';
import httpStatus from 'http-status';
import { Pagination } from '../../utils/helper/pagination';
import { ProductAttribute } from '.prisma/client';
import { DeliveryType, OrderStatus } from '@prisma/client';
import OneWarehouseClient from '../../utils/one-warehouse/client';
import { WarehouseExpressCode } from '../../utils/one-warehouse/client/type/data';
import BonusPointService from '../services/BonusPointService';

const idSchema = string().required();

type GetManyByAttributeQuery = Pagination & { attribute?: ProductAttribute };

const getManyByAttributeSchema: ObjectSchema<GetManyByAttributeQuery> = object({
  attribute: string()
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .optional(),
  take: number().min(0).max(200).default(10).optional(),
  skip: number().min(0).default(0).optional(),
});

interface Order {
  id: string;
  orderStatus: OrderStatus;
  attribute: ProductAttribute;
  price: number;
  createdAt: Date;
}

interface OrderDetail {
  id: string;
  orderStatus: OrderStatus;
  attribute: ProductAttribute;
  price: number;
  createdAt: Date;
  consignee: {
    deliveryType: DeliveryType;
    name: string | null;
    email: string | null;
    cellphone: string | null;
    addressDetailOne: string | null;
    addressDetailTwo: string | null;
    province: string | null;
    city: string | null;
    district: string | null;
    town: string | null;
    zipCode: string | null;
    remark: string | null;
    stationCode: string | null;
    stationName: string | null;
    senderRemark: string | null;
  };
  items: {
    productId: number | null;
    skuId: string | null;
    name: string;
    price: number;
    quantity: number;
  }[];
}

interface LogisticsDetail {
  id: string;
  outboundOrderId: string;
  packageInfos: {
    logisticsNo: string;
    expressNo: string;
    providerLogisticsCode: WarehouseExpressCode;
    deliveryType: 'HOME' | 'STORE';
  }[];
  outboundTime: Date | null;
  logisticsStatus: string;
}
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

  async getDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let id: string;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { role, id: userId } = req.userdata;
      const orderDetail = await OrderService.getOrderDetailById({
        id,
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
      const responseData: OrderDetail = {
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
      };
      res.status(httpStatus.OK).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    let id: string;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const { role, id: userId } = req.userdata;
      // Note: Check order exist (or user has the right to access the order)
      const order = await orderService.getOrderById({
        id,
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
        const result = await orderService.cancelOrderFromWaitPayment({ id });
        try {
          if (order.bonusPointRedemptionId) {
            await BonusPointService.cancelRedemption(order.bonusPointRedemptionId);
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
        // TODO:
        //  (1) 綠界退款
        //  (2) 作廢發票
        //  (3) 取消物流

        //  Note: 修改訂單狀態
        const result = await orderService.revokeOrderFromWaitDelivery({ id });
        try {
          if (order.bonusPointRedemptionId) {
            await BonusPointService.cancelRedemption(order.bonusPointRedemptionId);
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

  async getLogisticsDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let id: string;
    try {
      // Note: Check params is valid
      id = await idSchema.validate(req.params.id);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const { role, id: userId } = req.userdata;
      // Note: Check order exist (or user has the right to access the order)
      const order = await orderService.getOrderById({
        id,
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
        order_no: id,
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
}

export default new OrderController();
