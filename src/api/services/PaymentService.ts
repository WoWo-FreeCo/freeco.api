import ProductService, { ProductsItemization } from './ProductService';
import {
  OrderInvoiceInfo,
  ProductAttribute,
  User,
  UserActivation,
} from '@prisma/client';
import moment from 'moment/moment';
import ecpayBaseOptions from '../../utils/ecpay/conf/baseOptions';
import userService, { MemberLevel } from './UserService';
import prisma from '../../database/client/prisma';
import Logger from '../../utils/logger';
import { AddressType, checkAddressType } from '../../utils/helper/address';
import {
  TAIWAN_ISLAND_DELIVERY_FEE_ID,
  OUTLYING_ISLAND_DELIVERY_FEE_ID,
  FREE_DELIVERY_ITEM_THRESHOLD_ID,
  FREE_DELIVERY_PRICE_THRESHOLD_ID,
} from '../../utils/constant';
import { Timeslot } from '../../utils/helper/timeslot';
import {
  ecpayInvoiceClient,
  ecpayPaymentClient,
} from '../../utils/ecpay/client';
import OrderService from './OrderService';
import { parseECPayResponse } from '../../utils/ecpay/common';
import ProductInventoryService from './ProductInventoryService';

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

export const DELIVERY_ITEM_NAME = '運費';
export const BONUS_POINT_ITEM_NAME = '紅利折抵';

export interface SettlementInput {
  attribute: ProductAttribute;
  user: User;
  userActivation: UserActivation;
  consignee: Consignee;
  products: {
    id: number;
    quantity: number;
  }[];
  bonusPointRedemption?: number;
}
interface PaymentInput {
  orderId: string;
  params?: {
    orderResultURL?: string;
    clientBackURL?: string;
  };
  paymentParams: {
    choosePayment: 'CREDIT_ONE_TIME' | 'CVS' | 'BARCODE';
    tradeDesc: string;
  };
}
interface IssueInvoiceInput {
  // // Note: 請帶30碼uid ex: SJDFJGH24FJIL97G73653XM0VOMS4K
  // relateNumber: string;
  // // Note: 客戶代號，長度為20字元
  // customerID: string;
  // // Note: 統一編號，長度為8字元
  // customerIdentifier: string;
  // // Note: 客戶名稱，長度為20字元
  // customerName: string;
  // // Note: 客戶地址，長度為100字元
  // customerAddr: string;
  // // Note: 客戶電話，長度為20字元
  // customerPhone: string;
  // // Note: 客戶信箱，長度為80字元
  // customerEmail: string;
  // // Note: 通關方式，僅可帶入'1'、'2'、''
  // clearanceMark: string;
  // // Note: 列印註記，僅可帶入'0'、'1'
  // print: string;
  // // Note: 捐贈註記，僅可帶入'1'、'0'
  // donation: string;
  // // Note: 愛心碼，長度為7字元
  // loveCode: string;
  // // Note: 載具類別，僅可帶入'1'、'2'、'3'、''
  // carruerType: string;
  // // Note: 載具編號，當載具類別為'2'時，長度為16字元，當載具類別為'3'時，長度為7字元
  // carruerNum: string;
  // // Note: 課稅類別，僅可帶入'1'、'2'、'3'、'9'
  // taxType: string;
  // // Note: 發票金額
  // salesAmount: string;
  // // Note: 備註
  // invoiceRemark: string;
  // // Note: 商品名稱，如果超過一樣商品時請以｜(為半形不可使用全形)分隔
  // itemName: string;
  // // Note: 商品數量，如果超過一樣商品時請以｜(為半形不可使用全形)分隔
  // itemCount: string;
  // // Note: 商品單位，如果超過一樣商品時請以｜(為半形不可使用全形)分隔
  // itemWord: string;
  // // Note: 商品價格，如果超過一樣商品時請以｜(為半形不可使用全形)分隔
  // itemPrice: string;
  // // Note: 商品課稅別，如果超過一樣商品時請以｜(為半形不可使用全形)分隔，如果TaxType為9請帶值，其餘為空
  // itemTaxType: string;
  // // Note: 商品合計，如果超過一樣商品時請以｜(為半形不可使用全形)分隔
  // itemAmount: string;
  // // Note: 商品備註，如果超過一樣商品時請以｜(為半形不可使用全形)分隔
  // itemRemark: string;
  // // Note: 字軌類別，、'07'一般稅額
  // invType: string;
  // // Note: 商品單價是否含稅，'1'為含稅價'、'2'為未稅價
  // vat: string;
  invoiceInfo: OrderInvoiceInfo;
}
export interface SettlementResult {
  items: {
    productId: number | null;
    productSkuId: string | null;
    name: string;
    quantity: number;
    price: number;
    memberPrice: number;
    vipPrice: number;
    svipPrice: number;
    // Note: 最終付款金額
    paymentPrice: number;
  }[];
  priceInfo: {
    price: number;
    memberPrice: number;
    vipPrice: number;
    svipPrice: number;
  };
  deliveryFee: number;
  bonusPointRedemption: number;
  quantity: number;
  paymentPrice: number;
  inventoryEnough: boolean;
}
export interface ItemPayment {
  productId: number | null;
  productSkuId: string | null;
  name: string;
  quantity: number;
  paymentPrice: number;
}
interface IPaymentService {
  payment(data: PaymentInput): Promise<string | null>;
  settlement(data: SettlementInput): Promise<SettlementResult | null>;
  issueInvoice(data: IssueInvoiceInput): Promise<void>;
  cancelInvoice(data: { orderId: string }): Promise<boolean>;
}

class PaymentService implements IPaymentService {
  private static paymentPriceCalculate(data: {
    memberLevel: MemberLevel;
    priceInfo: {
      price: number;
      memberPrice: number;
      vipPrice: number;
      svipPrice: number;
    };
  }): number {
    const {
      memberLevel,
      priceInfo: { price, memberPrice, vipPrice, svipPrice },
    } = data;
    return memberLevel === 'NORMAL'
      ? memberPrice
      : memberLevel === 'VIP'
      ? vipPrice
      : memberLevel === 'SVIP'
      ? svipPrice
      : price;
  }
  private static priceInfoCalculate(data: {
    itemizationList: ProductsItemization[];
  }): {
    priceInfo: {
      price: number;
      memberPrice: number;
      vipPrice: number;
      svipPrice: number;
    };
    quantity: number;
  } {
    return data.itemizationList.reduce(
      (result, item) => ({
        ...result,
        quantity: result.quantity + item.quantity,
        priceInfo: {
          price: result.priceInfo.price + item.price * item.quantity,
          memberPrice:
            result.priceInfo.memberPrice + item.memberPrice * item.quantity,
          vipPrice: result.priceInfo.vipPrice + item.vipPrice * item.quantity,
          svipPrice:
            result.priceInfo.svipPrice + item.svipPrice * item.quantity,
        },
      }),
      {
        quantity: 0,
        priceInfo: {
          price: 0,
          memberPrice: 0,
          vipPrice: 0,
          svipPrice: 0,
        },
      },
    );
  }
  private static async deliveryFeeCalculate(
    addressType: AddressType,
    paymentPrice: number,
    quantity: number,
  ): Promise<number> {
    // return PaymentService.DEFAULT_DELIVERY_FEE;
    const freeDeliveryItemThreshold = (
      await prisma.deliveryFeeRule.findFirstOrThrow({
        where: { id: FREE_DELIVERY_ITEM_THRESHOLD_ID },
      })
    ).rule;
    const freeDeliveryPriceThreshold = (
      await prisma.deliveryFeeRule.findFirstOrThrow({
        where: { id: FREE_DELIVERY_PRICE_THRESHOLD_ID },
      })
    ).rule;

    if (
      quantity >= freeDeliveryItemThreshold ||
      paymentPrice >= freeDeliveryPriceThreshold
    )
      return 0;

    return (
      await prisma.deliveryFeeRule.findFirstOrThrow({
        where: {
          id:
            addressType == AddressType.TaiwanIsland
              ? TAIWAN_ISLAND_DELIVERY_FEE_ID
              : OUTLYING_ISLAND_DELIVERY_FEE_ID,
        },
      })
    ).rule;
  }
  private static settlementItemsCalculate(data: {
    itemizationList: ProductsItemization[];
    memberLevel: MemberLevel;
  }): SettlementResult['items'] {
    const { itemizationList, memberLevel } = data;
    return itemizationList.map((item) => ({
      ...item,
      paymentPrice:
        memberLevel === 'NORMAL'
          ? item.memberPrice
          : memberLevel === 'VIP'
          ? item.vipPrice
          : memberLevel === 'SVIP'
          ? item.svipPrice
          : item.price,
    }));
  }

  async payment(data: PaymentInput): Promise<string | null> {
    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
      },
      include: {
        invoiceInfo: true,
        orderItems: true,
      },
    });
    if (!order || !order.invoiceInfo) {
      return null;
    }
    const MerchantTradeDate = moment().format('YYYY/MM/DD HH:mm:ss');
    const orderItems = order.orderItems;
    const base_param = {
      MerchantTradeNo: order.merchantTradeNo,
      MerchantTradeDate,
      TotalAmount: order.price.toString(),
      TradeDesc: data.paymentParams.tradeDesc,
      ItemName: orderItems.map((item) => item.name).join('#'),
      ReturnURL: ecpayBaseOptions.returnURL,
      OrderResultURL: data.params?.orderResultURL
        ? data.params.orderResultURL
        : ecpayBaseOptions.orderResultURL,
      ClientBackURL: data.params?.clientBackURL
        ? data.params.clientBackURL
        : ecpayBaseOptions.clientBackURL,
      // ChooseSubPayment: '',
      // NeedExtraPaidInfo: '1',
      // ItemURL: 'http://item.test.tw',
      // Remark: 'Hello World',
      // HoldTradeAMT: '1',
      // StoreID: '',
      // CustomField1: '',
      // CustomField2: '',
      // CustomField3: '',
      // CustomField4: ''
    };
    const invoiceItem = orderItems.reduce(
      (result, item) => ({
        ...result,
        InvoiceItemName:
          result.InvoiceItemName === ''
            ? item.name
            : result.InvoiceItemName + `|${item.name}`,
        InvoiceItemCount:
          result.InvoiceItemCount === ''
            ? item.quantity
            : result.InvoiceItemCount + `|${item.quantity}`,
        InvoiceItemWord:
          result.InvoiceItemWord === '' ? `個` : result.InvoiceItemWord + `|個`,
        InvoiceItemPrice:
          result.InvoiceItemPrice === ''
            ? item.price
            : result.InvoiceItemPrice + `|${item.price}`,
        InvoiceItemTaxType:
          result.InvoiceItemTaxType === ''
            ? '1'
            : result.InvoiceItemTaxType + '|1',
      }),
      {
        InvoiceItemName: '',
        InvoiceItemCount: '',
        InvoiceItemWord: '',
        InvoiceItemPrice: '',
        InvoiceItemTaxType: '',
      },
    );
    const orderInvoiceInfo = order.invoiceInfo;
    const inv_params = {
      RelateNumber: order.relateNumber,
      CustomerID: orderInvoiceInfo.customerID || '',
      CustomerIdentifier: orderInvoiceInfo.customerIdentifier || '',
      CustomerName: orderInvoiceInfo.customerName || '',
      CustomerAddr: orderInvoiceInfo.customerAddr || '',
      CustomerPhone: orderInvoiceInfo.customerPhone || '',
      CustomerEmail: orderInvoiceInfo.customerEmail || '',
      Print: orderInvoiceInfo.print,
      Donation: orderInvoiceInfo.donation,
      LoveCode: orderInvoiceInfo.loveCode || '',
      CarruerType: orderInvoiceInfo.carruerType || '',
      CarruerNum: orderInvoiceInfo.carruerNum || '',
      TaxType: orderInvoiceInfo.taxType,
      InvoiceRemark: orderInvoiceInfo.remark || '',
      InvType: orderInvoiceInfo.invType,
      ClearanceMark: orderInvoiceInfo.clearanceMark || '',
      DelayDay: '0',
      ...invoiceItem,
    };
    let html = null;
    switch (data.paymentParams.choosePayment) {
      case 'CREDIT_ONE_TIME':
        html = ecpayPaymentClient().payment_client.aio_check_out_credit_onetime(
          base_param,
          inv_params,
        );
        break;
      case 'CVS':
        html = ecpayPaymentClient().payment_client.aio_check_out_cvs(
          {
            Desc_1: '',
            Desc_2: '',
            Desc_3: '',
            Desc_4: '',
            PaymentInfoURL: '',
            StoreExpireDate: '',
          },
          base_param,
          inv_params,
        );
        break;
      case 'BARCODE':
        html = ecpayPaymentClient().payment_client.aio_check_out_barcode(
          {
            Desc_1: '',
            Desc_2: '',
            Desc_3: '',
            Desc_4: '',
            PaymentInfoURL: '',
            StoreExpireDate: '',
          },
          base_param,
          inv_params,
        );
        break;
      default:
        break;
    }

    return String(html);
  }
  async settlement(data: SettlementInput): Promise<SettlementResult | null> {
    // Note: （會員系統）用戶資料、用戶紅利資料
    const memberLevel = userService.getUserMemberLevel({
      activation: data.userActivation,
    });

    // Note: (商品系統)
    const { itemizationList, anyProductNotExists } =
      await ProductService.productsItemization(data.products);
    const inventoryEnough =
      await ProductInventoryService.checkItemsIfInventoryEnough({
        items: itemizationList
          .filter((i) => i.productId !== null)
          .map((i: ProductsItemization & { productId: number }) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
      });
    if (anyProductNotExists) {
      return null;
    }

    // Note: (促銷系統）優惠資訊
    // TODO: 平台優惠、身份優惠、產品優惠

    // Note: （支付系統）價格計算
    // TODO: 價格計算
    const { priceInfo, quantity } = PaymentService.priceInfoCalculate({
      itemizationList,
    });
    const paymentPrice = PaymentService.paymentPriceCalculate({
      memberLevel,
      priceInfo,
    });
    const items = PaymentService.settlementItemsCalculate({
      itemizationList,
      memberLevel,
    });
    // Note: 使用紅利折抵
    const bonusPointRedemption = data.bonusPointRedemption
      ? data.bonusPointRedemption
      : 0;
    const deliveryFee =
      data.attribute == ProductAttribute.COLD_CHAIN
        ? 0
        : await PaymentService.deliveryFeeCalculate(
            checkAddressType(),
            paymentPrice,
            quantity,
          );

    const settleResult: SettlementResult = {
      items,
      quantity,
      deliveryFee,
      priceInfo,
      paymentPrice,
      bonusPointRedemption,
      inventoryEnough,
    };

    // Note: 將運費紀為一筆 item
    if (settleResult.deliveryFee > 0) {
      settleResult.items.push({
        productId: null,
        productSkuId: null,
        name: DELIVERY_ITEM_NAME,
        price: settleResult.deliveryFee,
        memberPrice: settleResult.deliveryFee,
        vipPrice: settleResult.deliveryFee,
        svipPrice: settleResult.deliveryFee,
        paymentPrice: settleResult.deliveryFee,
        quantity: 1,
      });
      settleResult.quantity += 1;
      settleResult.priceInfo.price += settleResult.deliveryFee;
      settleResult.priceInfo.memberPrice += settleResult.deliveryFee;
      settleResult.priceInfo.vipPrice += settleResult.deliveryFee;
      settleResult.priceInfo.svipPrice += settleResult.deliveryFee;
      settleResult.paymentPrice += settleResult.deliveryFee;
    }

    // Note: 將紅利折抵紀為一筆 item
    if (settleResult.bonusPointRedemption > 0) {
      settleResult.items.push({
        productId: null,
        productSkuId: null,
        name: BONUS_POINT_ITEM_NAME,
        price: 0 - settleResult.bonusPointRedemption,
        memberPrice: 0 - settleResult.bonusPointRedemption,
        vipPrice: 0 - settleResult.bonusPointRedemption,
        svipPrice: 0 - settleResult.bonusPointRedemption,
        paymentPrice: 0 - settleResult.bonusPointRedemption,
        quantity: 1,
      });
      settleResult.quantity += 1;
      settleResult.priceInfo.price -= settleResult.bonusPointRedemption;
      settleResult.priceInfo.memberPrice -= settleResult.bonusPointRedemption;
      settleResult.priceInfo.vipPrice -= settleResult.bonusPointRedemption;
      settleResult.priceInfo.svipPrice -= settleResult.bonusPointRedemption;
      settleResult.paymentPrice -= settleResult.bonusPointRedemption;
    }

    // Note: （倉儲系統）庫存檢查、運費計算、庫存調整
    // TODO: 庫存檢查、運費計算、庫存調整

    // Note: 回傳結算結果
    return settleResult;
  }
  async issueInvoice(data: IssueInvoiceInput): Promise<void> {
    const response =
      await ecpayInvoiceClient().invoice_client.ecpay_invoice_issue({
        RelateNumber: data.invoiceInfo.orderRelateNumber,
        CustomerID: data.invoiceInfo.customerID || '',
        CustomerIdentifier: data.invoiceInfo.customerIdentifier || '',
        CustomerName: data.invoiceInfo.customerName || '',
        CustomerAddr: data.invoiceInfo.customerAddr || '',
        CustomerPhone: data.invoiceInfo.customerPhone || '',
        CustomerEmail: data.invoiceInfo.customerEmail || '',
        ClearanceMark: data.invoiceInfo.clearanceMark || '',
        Print: data.invoiceInfo.print,
        Donation: data.invoiceInfo.donation,
        LoveCode: data.invoiceInfo.loveCode || '',
        CarruerType: data.invoiceInfo.carruerType || '',
        CarruerNum: data.invoiceInfo.carruerNum || '',
        TaxType: data.invoiceInfo.taxType,
        SalesAmount: data.invoiceInfo.salesAmount,
        InvoiceRemark: data.invoiceInfo.remark || '',
        ItemName: data.invoiceInfo.itemName,
        ItemCount: data.invoiceInfo.itemCount,
        ItemWord: data.invoiceInfo.itemWord,
        ItemPrice: data.invoiceInfo.itemPrice,
        ItemTaxType: data.invoiceInfo.itemTaxType || '',
        ItemAmount: data.invoiceInfo.itemAmount,
        ItemRemark: data.invoiceInfo.itemRemark,
        InvType: data.invoiceInfo.invType,
        vat: data.invoiceInfo.vat,
      });
    Logger.info(
      `RelateNumber: ${data.invoiceInfo.orderRelateNumber} - ${response}`,
    );
  }
  async cancelInvoice(data: { orderId: string }): Promise<boolean> {
    const order = await OrderService.getOrderById({ id: data.orderId });

    if (!order) {
      Logger.error(
        `Get Order By Id failed - it could be internal error somewhere`,
      );
      return false;
    }

    const { relateNumber } = order;
    const queryInvoiceResponse =
      await ecpayInvoiceClient().query_client.ecpay_query_invoice_issue({
        RelateNumber: relateNumber, // 輸入合作特店自訂的編號，長度為30字元
      });

    const queryInvoiceResObj = parseECPayResponse<{
      RtnCode: string;
      IIS_Number: string;
    }>(queryInvoiceResponse);
    if (queryInvoiceResObj.RtnCode !== '1') {
      Logger.error(`Query invoice failed - ${queryInvoiceResObj}`);
      return false;
    }

    const invoiceNumber = queryInvoiceResObj.IIS_Number;
    const cancelInvoiceResponse =
      await ecpayInvoiceClient().invoice_client.ecpay_invoice_issue_invalid({
        InvoiceNumber: invoiceNumber, // 發票號碼，長度為10字元
        Reason: '無特殊原因', // 作廢原因，長度為20字元
      });

    const cancelInvoiceResObj = parseECPayResponse<{ RtnCode: string }>(
      cancelInvoiceResponse,
    );
    if (cancelInvoiceResObj.RtnCode !== '1') {
      Logger.error(`Cancel invoice failed - ${cancelInvoiceResObj}`);
      return false;
    }

    Logger.info(`InvoiceNumber: ${invoiceNumber} - ${cancelInvoiceResObj}`);
    return true;
  }
}

export default new PaymentService();
