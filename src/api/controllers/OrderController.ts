import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import OrderService from '../services/OrderService';
import orderService, { CancelOrderResultCode } from '../services/OrderService';
import httpStatus from 'http-status';
import { Pagination } from '../../utils/helper/pagination';
import { ProductAttribute } from '.prisma/client';
import { DeliveryType, OrderStatus } from '@prisma/client';

const idSchema = string().length(19).required();

type GetManyByAttributeQuery = Pagination & { attribute?: ProductAttribute };

const getManyByAttributeSchema: ObjectSchema<GetManyByAttributeQuery> = object({
  attribute: string()
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .optional(),
  take: number().min(0).default(10).optional(),
  skip: number().min(0).max(200).default(0).optional(),
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

      if (order.orderStatus === OrderStatus.CANCELLED) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: 'Order has been cancelled.',
        });
        return;
      }

      if (order.orderStatus !== OrderStatus.WAIT_PAYMENT) {
        res.status(httpStatus.BAD_REQUEST).json({
          message:
            'Order payment has been paid. The order cannot be canceled at this time. ' +
            'Please contact our customer service staff for effective assistance.',
        });
        return;
      }

      const result = await orderService.cancelOrder({ id });
      if (result.code !== CancelOrderResultCode.SUCCESS) {
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
        return;
      }
      res.sendStatus(httpStatus.ACCEPTED);
      return;
    } catch (err) {
      next(err);
    }
  }
}

export default new OrderController();
