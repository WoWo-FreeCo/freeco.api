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

interface Product {
  id: number;
  amount: number;
}

const productSchema: ObjectSchema<Product> = object({
  id: number().required(),
  amount: number().required().min(1),
});

interface Receiver {
  name: string;
  phone: string;
  addr: string;
  arrivalAt?: Date;
}

const receiverSchema: ObjectSchema<Receiver> = object({
  name: string().required(),
  phone: string().required(),
  addr: string().required(),
  arrivalAt: date().default(undefined).optional(),
});

interface InvoiceParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddr: string;
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
  carruerType: string().oneOf(['', '1', '2', '3']).ensure(),
  carruerNum: string().default('').optional(),
  donation: string().oneOf(['0', '1']).required(),
  loveCode: string().default('').optional(),
});

interface SettlementBody {
  products: Product[];
}

const settleSchema: ObjectSchema<SettlementBody> = object({
  products: array().required().of(productSchema),
});

type Settlement = SettlementResult;

interface PaymentBody {
  receiver: Receiver;
  products: Product[];
  invoiceParams: InvoiceParams;
  orderNote?: string;
}

const paymentSchema: ObjectSchema<PaymentBody> = object({
  receiver: receiverSchema,
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

      // Note: Make a payment
      const paymentFormHtml = await PaymentService.payment({
        user: {
          id: user.id,
          memberLevel,
        },
        data: {
          products: paymentBody.products,
        },
        paymentParams: {
          choosePayment: 'Credit',
          tradeDesc: 'This is trade description',
        },
        invoiceParams: {
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
    try {
      Logger.debug(req.body);
      res.status(httpStatus.OK).send('1|OK');
    } catch (err) {
      next(err);
    }
  }
}

export default new PaymentController();
