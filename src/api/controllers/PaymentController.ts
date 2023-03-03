import { NextFunction, Request, Response } from 'express';
import {
  array,
  number,
  object,
  ObjectSchema,
  string,
  ValidationError,
} from 'yup';
import httpStatus from 'http-status';
import Logger from '../../utils/logger';
import UserService from '../services/UserService';
import PaymentService, { SettlementResult } from '../services/PaymentService';
import OrderService from '../services/OrderService';
import config from 'config';
import { ProductAttribute } from '.prisma/client';
import { OrderStatus } from '@prisma/client';
import BonusPointService from '../services/BonusPointService';
import { Timeslot, timeslotUtility } from '../../utils/helper/timeslot';

interface Product {
  id: number;
  quantity: number;
}

const productSchema: ObjectSchema<Product> = object({
  id: number().required(),
  quantity: number().required().min(1),
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
  requiredDeliveryTimeslots: array()
    .of(timeslotUtility.schema)
    .default([])
    .optional(),
});

interface InvoiceParams {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddr?: string;
  customerIdentifier?: string;
  carruerType?: '' | '1' | '2' | '3';
  carruerNum?: string;
  donation: '0' | '1';
  loveCode?: string;
}

const invoiceParamsSchema: ObjectSchema<InvoiceParams> = object({
  customerName: string().optional(),
  customerEmail: string().email().optional(),
  customerPhone: string().optional(),
  customerAddr: string().optional(),
  customerIdentifier: string().length(8).optional(),
  carruerType: string().oneOf(['', '1', '2', '3']).ensure(),
  carruerNum: string().default('').optional(),
  donation: string().oneOf(['0', '1']).required(),
  loveCode: string().default('').optional(),
});

interface SettlementBody {
  attribute: ProductAttribute;
  products: Product[];
  // Note: 使用紅利消費
  bonusPointRedemption?: number;
  consignee: Consignee;
}

const settleSchema: ObjectSchema<SettlementBody> = object({
  attribute: string()
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .required(),
  products: array().required().of(productSchema),
  bonusPointRedemption: number().moreThan(-1).optional(),
  consignee: consigneeSchema,
});

type Settlement = SettlementResult;

interface PaymentBody {
  // Note: 信用卡一次付清、超商代碼、超商條碼
  choosePayment: 'CREDIT_ONE_TIME' | 'CVS' | 'BARCODE';
  attribute: ProductAttribute;
  consignee: Consignee;
  products: Product[];
  // Note: 使用紅利消費
  bonusPointRedemption?: number;
  invoiceParams: InvoiceParams;
  orderNote?: string;
}

const paymentSchema: ObjectSchema<PaymentBody> = object({
  choosePayment: string()
    .oneOf(['CREDIT_ONE_TIME', 'CVS', 'BARCODE'])
    .required(),
  attribute: string()
    .oneOf([ProductAttribute.GENERAL, ProductAttribute.COLD_CHAIN])
    .required(),
  consignee: consigneeSchema,
  products: array().required().of(productSchema),
  bonusPointRedemption: number().moreThan(-1).optional(),
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

      // Note: Check if user has enough amount of bonus points
      if (
        paymentBody.bonusPointRedemption &&
        paymentBody.bonusPointRedemption > 0
      ) {
        const bonusPointBalance =
          await BonusPointService.getUserBonusPointBalance(id);
        if (paymentBody.bonusPointRedemption > bonusPointBalance) {
          res.status(httpStatus.BAD_REQUEST).send('紅利點數不足！');
          return;
        }
      }

      // Note: Init settlement result
      const settlementResult = await PaymentService.settlement({
        attribute: paymentBody.attribute,
        user: user,
        userActivation: user.activation,
        consignee: paymentBody.consignee,
        products: paymentBody.products,
        bonusPointRedemption: paymentBody.bonusPointRedemption
          ? paymentBody.bonusPointRedemption
          : 0,
      });
      if (!settlementResult) {
        res.status(httpStatus.BAD_REQUEST).json({
          message: 'One (or many) of product ids not exist.',
        });
        return;
      }

      if (
        settlementResult.bonusPointRedemption >
        settlementResult.paymentPrice + settlementResult.bonusPointRedemption
      ) {
        res.status(httpStatus.BAD_REQUEST).send('紅利使用超過折抵上限！');
        return;
      }

      // Note: Create an order
      const order = await OrderService.createOrder({
        userId: user.id,
        paymentPrice: settlementResult.paymentPrice,
        attribute: paymentBody.attribute,
        consignee: paymentBody.consignee,
        items: settlementResult.items,
        invoiceInfo: {
          customerID: '',
          customerIdentifier: paymentBody.invoiceParams.customerIdentifier,
          customerName: paymentBody.invoiceParams.customerName,
          customerAddr: paymentBody.invoiceParams.customerAddr,
          customerPhone: paymentBody.invoiceParams.customerPhone,
          customerEmail: paymentBody.invoiceParams.customerEmail,
          print: '1',
          donation: paymentBody.invoiceParams.donation,
          loveCode: paymentBody.invoiceParams.loveCode,
          carruerType: paymentBody.invoiceParams.carruerType,
          carruerNum: paymentBody.invoiceParams.carruerNum,
          taxType: '1',
          remark: '',
          invType: '07',
          vat: '1',
        },
        bonusPointRedemption: settlementResult.bonusPointRedemption,
      });

      // Note: Make a payment from the order just created before
      const paymentFormHtml = await PaymentService.payment({
        orderId: order.id,
        params: {
          orderResultURL: req.query['order_result_url'] as string,
          clientBackURL: req.query['client_back_url'] as string,
        },
        paymentParams: {
          choosePayment: paymentBody.choosePayment,
          tradeDesc: 'tradeDesc',
        },
      });

      if (paymentFormHtml === null) {
        // TODO: 金流失敗，若訂單成功被創建，此時需要從資料庫刪除訂單
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Payment is not created successfully.',
        });
        return;
      }

      res.status(httpStatus.OK).send(paymentFormHtml);
    } catch (err) {
      next(err);
    }
  }

  async preSettlement(
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
      const { id } = req.userdata;
      // Note: Get user information and member level
      const user = await UserService.getUserProfileById({ id });
      if (!user || !user.activation) {
        res.sendStatus(httpStatus.NOT_FOUND);
        return;
      }

      // Note: Check if user has enough amout of bonus points
      if (
        settleBody.bonusPointRedemption &&
        settleBody.bonusPointRedemption > 0
      ) {
        const bonusPointBalance =
          await BonusPointService.getUserBonusPointBalance(id);
        if (settleBody.bonusPointRedemption > bonusPointBalance) {
          res.status(httpStatus.BAD_REQUEST).send('紅利點數不足！');
          return;
        }
      }

      const result: Settlement | null = await PaymentService.settlement({
        user,
        userActivation: user.activation,
        ...settleBody,
      });

      if (result) {
        if (
          result.bonusPointRedemption >
          result.paymentPrice + result.bonusPointRedemption
        ) {
          res.status(httpStatus.BAD_REQUEST).send('紅利使用超過折抵上限！');
          return;
        }

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
        if (orderDetail && orderDetail.consignee && orderDetail.invoiceInfo) {
          // Note: 訂單等待付款
          if (orderDetail.orderStatus === OrderStatus.WAIT_PAYMENT) {
            switch (orderDetail.attribute) {
              case 'GENERAL':
                await PaymentService.issueInvoice({
                  invoiceInfo: orderDetail.invoiceInfo,
                });
                await OrderService.createOutboundOrder({
                  order: orderDetail,
                  consignee: orderDetail.consignee,
                  orderItems: orderDetail.orderItems,
                });
                break;
            }
            await OrderService.completeOrderPaymentFromWaitDelivery({
              id: orderDetail.id,
            });
            // Note: 訂單已取消
          } else if (orderDetail.orderStatus === OrderStatus.CANCELLED) {
            // TODO:
            //  (1) 綠界退款
            // Note: 變更 orderStatus 為 REVOKED
            await OrderService.revokeOrderFromWaitPayment({
              id: orderDetail.id,
            });
            // Note: 訂單並未等待付款，也並未取消。該訂單已經付款完畢，卻再次收到來自綠界通知
          } else {
            Logger.error(
              `Error: Order payment has been settled in advance. There might be potential bugs beneath.`,
            );
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
