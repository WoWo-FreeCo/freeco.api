import { NextFunction, Request, Response } from 'express';
import {
  array,
  date,
  number,
  object,
  ObjectSchema,
  string,
  ValidationError,
} from 'yup';
import httpStatus from 'http-status';
import Logger from '../../utils/logger';
import UserService from '../services/UserService';
import userService from '../services/UserService';
import PaymentService, { SettlementResult } from '../services/PaymentService';
import OrderService, { Timeslot } from '../services/OrderService';
import config from 'config';
import { ProductAttribute } from '.prisma/client';

interface Product {
  id: number;
  quantity: number;
}

const productSchema: ObjectSchema<Product> = object({
  id: number().required(),
  quantity: number().required().min(1),
});

const timeslotSchema: ObjectSchema<Timeslot> = object({
  date: date().required(),
  slot: string().required(),
});

interface Consignee {
  deliveryType: 'HOME' | 'STORE';
  addressDetailOne?: string;
  addressDetailTwo?: string;
  city?: string;
  district?: string;
  email?: string;
  idNo?: string;
  idType?: '1';
  cellphone?: string;
  name?: string;
  province?: string;
  remark?: string;
  stationCode?: string;
  stationName?: string;
  town?: string;
  zipCode?: string;
  senderRemark?: string;
  requiredDeliveryTimeslots?: Timeslot[];
}

const consigneeSchema: ObjectSchema<Consignee> = object({
  deliveryType: string().oneOf(['HOME', 'STORE']).required(),
  addressDetailOne: string().optional(),
  addressDetailTwo: string().optional(),
  city: string().optional(),
  district: string().optional(),
  email: string().optional(),
  idNo: string().optional(),
  idType: string().oneOf(['1']).optional(),
  cellphone: string().optional(),
  name: string().optional(),
  province: string().optional(),
  remark: string().optional(),
  stationCode: string().optional(),
  stationName: string().optional(),
  town: string().optional(),
  zipCode: string().optional(),
  senderRemark: string().optional(),
  requiredDeliveryTimeslots: array().of(timeslotSchema).default([]).optional(),
});

interface InvoiceParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddr: string;
  customerIdentifier?: string;
  carruerType: '' | '1' | '2' | '3';
  carruerNum: string;
  donation: '0' | '1';
  loveCode: string;
}

const invoiceParamsSchema: ObjectSchema<InvoiceParams> = object({
  customerName: string().required(),
  customerEmail: string().email().required(),
  customerPhone: string().required(),
  customerAddr: string().required(),
  customerIdentifier: string().length(8).optional(),
  carruerType: string().oneOf(['', '1', '2', '3']).ensure(),
  carruerNum: string().default('').optional(),
  donation: string().oneOf(['0', '1']).required(),
  loveCode: string().default('').optional(),
});

interface SettlementBody {
  attribute: ProductAttribute;
  products: Product[];
}

const settleSchema: ObjectSchema<SettlementBody> = object({
  attribute: string()
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .required(),
  products: array().required().of(productSchema),
});

type Settlement = SettlementResult;

interface PaymentBody {
  attribute: ProductAttribute;
  consignee: Consignee;
  products: Product[];
  invoiceParams: InvoiceParams;
  orderNote?: string;
}

const paymentSchema: ObjectSchema<PaymentBody> = object({
  attribute: string()
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .required(),
  consignee: consigneeSchema,
  products: array().required().of(productSchema),
  invoiceParams: invoiceParamsSchema,
  orderNote: string().optional(),
});

class PaymentController {
  async payment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let paymentBody: PaymentBody;
    try {
      // Note: Check request body is valid
      paymentBody = await paymentSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }
    try {
      const { id } = req.userdata;
      // Note: Get user information and member level
      const user = await UserService.getUserProfileById({ id });
      if (!user || !user.activation) {
        res.sendStatus(httpStatus.NOT_FOUND);
        return;
      }
      const memberLevel = userService.getUserMemberLevel({
        activation: user.activation,
      });

      const settlementResult = await PaymentService.settlement(paymentBody);

      if (!settlementResult) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: 'One (or many) of product ids not exist.',
        });
        return;
      }

      // Note: Calculate the price of order
      const price =
        memberLevel === 'NORMAL'
          ? settlementResult.total.memberPrice
          : memberLevel === 'VIP'
          ? settlementResult.total.vipPrice
          : memberLevel === 'SVIP'
          ? settlementResult.total.svipPrice
          : settlementResult.total.price;

      // Note: Create an order
      const order = await OrderService.createOrder({
        userId: user.id,
        price,
        attribute: paymentBody.attribute,
        consignee: paymentBody.consignee,
        items: settlementResult.items.map((item) => ({
          productSkuId: item.skuId,
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.amount,
        })),
      });

      // Note: Make a payment
      const orderResultURL = req.query['order_result_url'] as string;
      const clientBackURL = req.query['client_back_url'] as string;
      const paymentFormHtml = await PaymentService.payment({
        params: {
          orderResultURL,
          clientBackURL,
        },
        price,
        data: {
          products: paymentBody.products,
        },
        paymentParams: {
          merchantTradeNo: order.merchantTradeNo,
          choosePayment: 'Credit',
          tradeDesc: 'This is trade description',
        },
        invoiceParams: {
          relateNumber: order.relateNumber,
          ...paymentBody.invoiceParams,
        },
      });

      res.status(httpStatus.OK).send(paymentFormHtml);
    } catch (err) {
      next(err);
    }
  }

  async settlement(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    let settleBody: SettlementBody;
    try {
      // Note: Check request body is valid
      settleBody = await settleSchema.validate(req.body);
    } catch (err) {
      res.status(httpStatus.BAD_REQUEST).send((err as ValidationError).message);
      return;
    }

    try {
      const result: Settlement | null = await PaymentService.settlement({
        ...settleBody,
      });

      if (result) {
        res.status(httpStatus.OK).json({
          data: result,
        });
      } else {
        res.status(httpStatus.BAD_REQUEST).json({
          message: 'One (or many) of product ids not exist.',
        });
      }
    } catch (err) {
      next(err);
    }
  }
  async listenResult(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (config.get<boolean>('isDevelopment')) {
      Logger.debug(`Result from ECPAY: ${JSON.stringify(req.body, null, 3)}`);
    }
    try {
      if (req.body.RtnCode === '1') {
        const orderDetail = await OrderService.getOrderDetailByMerchantTradeNo({
          merchantTradeNo: req.body.MerchantTradeNo,
        });
        if (orderDetail && orderDetail.consignee) {
          switch (orderDetail.attribute) {
            case 'GENERAL':
              await OrderService.createOutboundOrder({
                order: orderDetail,
                consignee: orderDetail.consignee,
                orderItems: orderDetail.orderItems,
              });
              break;
          }
        } else {
          Logger.error(
            `Error: Cannot fetch order by MerchantTradeNo[${req.body.MerchantTradeNo}]. This error will cause oneWarehouse not receive this order`,
          );
        }
      } else {
        Logger.error(`ECPay Error(${req.body.RtnCode}): ${req.body.RtnMsg}`);
        Logger.error(req.body);
      }

      res.status(httpStatus.OK).send('1|OK');
    } catch (err) {
      next(err);
    }
  }
}

export default new PaymentController();
