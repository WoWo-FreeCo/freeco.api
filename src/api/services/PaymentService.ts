import ProductService from './ProductService';
import { Product as PrismaProduct } from '.prisma/client';
import { Product } from '@prisma/client';
import moment from 'moment/moment';
import ecpayOptions from '../../utils/ecpay/conf';
import ecpay_payment from 'ecpay_aio_nodejs/lib/ecpay_payment';
import ecpayBaseOptions from '../../utils/ecpay/conf/baseOptions';

interface SettlementInput {
  products: {
    id: number;
    amount: number;
  }[];
}

export interface SettlementResult {
  items: {
    id: number;
    skuId: string | null;
    name: string;
    amount: number;
    price: number;
    memberPrice: number;
    vipPrice: number;
    svipPrice: number;
  }[];
  total: {
    price: number;
    memberPrice: number;
    vipPrice: number;
    svipPrice: number;
  };
  itemsCount: number;
  deliveryFee: number;
}

interface PaymentInput {
  params?: {
    orderResultURL?: string;
    clientBackURL?: string;
  };
  price: number;
  data: SettlementInput;
  paymentParams: {
    // Note: 請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
    merchantTradeNo: string;
    choosePayment: 'Credit';
    tradeDesc: string;
  };
  invoiceParams: {
    //Note: 請帶30碼uid ex: SJDFJGH24FJIL97G73653XM0VOMS4K
    relateNumber: string;
    customerName: string;
    customerAddr: string;
    customerPhone: string;
    customerEmail: string;
    // Note:
    // 當 `carruerType` 為 ""(無載具) 或 "1"(會員載具), `carruerNum`為空字串
    // 當 `carruerType` 為 "2"(自然人憑證), `carruerNum`格式:長度16,前2碼為大小寫字母,後14碼為數字
    // 當 `carruerType` 為 "3"(手機條碼), `carruerNum`格式:長度8,前1碼為'/',後7碼為數字或大小寫字母
    carruerType: '' | '1' | '2' | '3';
    carruerNum: string;
    // Note: 是否捐揍發票: 不捐贈: 0; 捐贈:1
    donation: '0' | '1';
    // Note: 受捐贈愛心碼
    loveCode: string;
  };
}
interface IOrderService {
  payment(data: PaymentInput): Promise<string | null>;
  settlement(data: SettlementInput): Promise<SettlementResult | null>;
}

class OrderService implements IOrderService {
  private readonly DEFAULT_DELIVERY_FEE: number = 60;
  async payment(data: PaymentInput): Promise<string | null> {
    const settlementResult = await this.settlement(data.data);
    if (!settlementResult) {
      return null;
    }
    const MerchantTradeDate = moment().format('YYYY/MM/DD HH:mm:ss');
    const base_param = {
      MerchantTradeNo: data.paymentParams.merchantTradeNo, //請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
      MerchantTradeDate, //ex: 2017/02/13 15:45:30
      TotalAmount: data.price.toString(),
      TradeDesc: data.paymentParams.tradeDesc,
      ReturnURL: ecpayBaseOptions.returnURL,
      ItemName: settlementResult.items.map((item) => item.name).join('#'),
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
    const InvoiceItem = settlementResult.items.reduce(
      (invoiceItem, item) => ({
        InvoiceItemName:
          invoiceItem.InvoiceItemName === ''
            ? item.name
            : invoiceItem.InvoiceItemName + `|${item.name}`,
        InvoiceItemCount:
          invoiceItem.InvoiceItemCount === ''
            ? item.amount
            : invoiceItem.InvoiceItemCount + `|${item.amount}`,
        InvoiceItemWord:
          invoiceItem.InvoiceItemWord === ''
            ? `個`
            : invoiceItem.InvoiceItemWord + `|個`,
        InvoiceItemPrice:
          invoiceItem.InvoiceItemPrice === ''
            ? item.price
            : invoiceItem.InvoiceItemPrice + `|${item.price}`,
        InvoiceItemTaxType:
          invoiceItem.InvoiceItemTaxType === ''
            ? '1'
            : invoiceItem.InvoiceItemTaxType + '|1',
      }),
      {
        InvoiceItemName: '',
        InvoiceItemCount: '',
        InvoiceItemWord: '',
        InvoiceItemPrice: '',
        InvoiceItemTaxType: '',
      },
    );
    // 若要測試開立電子發票，請將inv_params內的"所有"參數取消註解 //
    const inv_params = {
      RelateNumber: data.invoiceParams.relateNumber, //請帶30碼uid ex: SJDFJGH24FJIL97G73653XM0VOMS4K
      CustomerID: '', //會員編號
      CustomerIdentifier: '00000000', //統一編號
      CustomerName: data.invoiceParams.customerName,
      CustomerAddr: data.invoiceParams.customerAddr,
      CustomerPhone: data.invoiceParams.customerPhone,
      CustomerEmail: data.invoiceParams.customerEmail,
      ClearanceMark: '2',
      TaxType: '1',
      CarruerType: data.invoiceParams.carruerType,
      CarruerNum: data.invoiceParams.carruerNum,
      Donation: data.invoiceParams.donation,
      LoveCode: data.invoiceParams.loveCode,
      Print: '1',
      InvoiceRemark: '測試商品1的說明|測試商品2的說明',
      DelayDay: '0',
      InvType: '07',
      ...InvoiceItem,
      // InvoiceItemName: '測試商品1|測試商品2',
      // InvoiceItemCount: '2|3',
      // InvoiceItemWord: '個|包',
      // InvoiceItemPrice: '35|10',
      // InvoiceItemTaxType: '1|1',
    };
    const create = new ecpay_payment(ecpayOptions);
    const html = create.payment_client.aio_check_out_credit_onetime(
      base_param,
      inv_params,
    );

    return String(html);
  }
  async settlement(data: SettlementInput): Promise<SettlementResult | null> {
    const products = await ProductService.getProductsByIds({
      ids: data.products.map((product) => product.id),
    });
    const productsMap = new Map<Product['id'], PrismaProduct>();
    const settlementItemsMap = new Map<
      Product['id'],
      SettlementResult['items'][0]
    >();
    products.forEach((product) => {
      productsMap.set(product.id, product);
    });
    let anyProductNotExists = false;
    data.products.forEach((item) => {
      const product = productsMap.get(item.id);
      const settlementItem = settlementItemsMap.get(item.id);
      if (product) {
        if (!settlementItem) {
          settlementItemsMap.set(product.id, {
            id: product.id,
            skuId: product.skuId,
            name: product.name,
            amount: item.amount,
            price: item.amount * product.price,
            memberPrice: item.amount * product.memberPrice,
            vipPrice: item.amount * product.vipPrice,
            svipPrice: item.amount * product.svipPrice,
          });
        } else {
          settlementItemsMap.set(product.id, {
            ...settlementItem,
            amount: settlementItem.amount + item.amount,
            price: settlementItem.price + item.amount * product.price,
            memberPrice:
              settlementItem.memberPrice + item.amount * product.memberPrice,
            vipPrice: settlementItem.vipPrice + item.amount * product.vipPrice,
            svipPrice:
              settlementItem.svipPrice + item.amount * product.svipPrice,
          });
        }
      } else {
        anyProductNotExists = true;
      }
    });
    const items = Array.from(settlementItemsMap.values());

    const settleResult: SettlementResult = {
      items: items,
      itemsCount: 0,
      deliveryFee: this.DEFAULT_DELIVERY_FEE,
      total: {
        price: 0,
        memberPrice: 0,
        vipPrice: 0,
        svipPrice: 0,
      },
    };

    const result = items.reduce<SettlementResult>((result, item) => {
      result.itemsCount += item.amount;
      result.total.price += item.price * item.amount;
      result.total.memberPrice += item.memberPrice * item.amount;
      result.total.vipPrice += item.vipPrice * item.amount;
      result.total.svipPrice += item.svipPrice * item.amount;
      return result;
    }, settleResult);

    if (settleResult.deliveryFee > 0) {
      settleResult.items.push({
        id: -1,
        skuId: null,
        name: '運費',
        price: settleResult.deliveryFee,
        memberPrice: settleResult.deliveryFee,
        vipPrice: settleResult.deliveryFee,
        svipPrice: settleResult.deliveryFee,
        amount: 1,
      });
      settleResult.itemsCount += 1;
      settleResult.total.price += settleResult.deliveryFee;
      settleResult.total.memberPrice += settleResult.deliveryFee;
      settleResult.total.vipPrice += settleResult.deliveryFee;
      settleResult.total.svipPrice += settleResult.deliveryFee;
    }

    return anyProductNotExists ? null : result;
  }
}

export default new OrderService();
