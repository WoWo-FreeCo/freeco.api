import { NextFunction, Request, Response } from 'express';
import { number, object, ObjectSchema, string, ValidationError } from 'yup';
import OrderService from '../services/OrderService';
import httpStatus from 'http-status';
import { Pagination } from '../../utils/helper/pagination';
import { ProductAttribute } from '.prisma/client';
import { OrderStatus } from '@prisma/client';

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
  price: number;
  createdAt: Date;
}

class AdminOrderController {
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
      const orders = await OrderService.getOrders({
        attribute: getManyByAttributeQuery.attribute,
        pagination: {
          ...getManyByAttributeQuery,
        },
      });

      const responseData: Order[] = orders.map((order) => ({
        id: order.id,
        orderStatus: order.orderStatus,
        price: order.price,
        createdAt: order.createdAt,
      }));

      res.status(httpStatus.OK).json({ data: responseData });
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminOrderController();
