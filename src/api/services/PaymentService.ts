import ProductService, { ProductsItemization } from './ProductService';
import { User, UserActivation } from '@prisma/client';
import moment from 'moment/moment';
import ecpayOptions from '../../utils/ecpay/conf';
import EcpayPayment from 'ecpay_aio_nodejs/lib/ecpay_payment';
import ecpayBaseOptions from '../../utils/ecpay/conf/baseOptions';
import userService, { MemberLevel } from './UserService';

interface SettlementInput {
  user: User;
  userActivation: UserActivation;
  products: {
    id: number;
    quantity: number;
  }[];
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
  }[];
  priceInfo: {
    price: number;
    memberPrice: number;
    vipPrice: number;
    svipPrice: number;
  };
  deliveryFee: number;
  quantity: number;
  paymentPrice: number;
}

interface PaymentInput {
  params?: {
    orderResultURL?: string;
    clientBackURL?: string;
  };
  paymentPrice: number;
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
    // Note: 統一編號 固定 8 位長度數字
    customerIdentifier?: string;
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
interface IPaymentService {
  payment(data: PaymentInput): Promise<string | null>;
  settlement(data: SettlementInput): Promise<SettlementResult | null>;
}

class PaymentService implements IPaymentService {
  private static readonly DEFAULT_DELIVERY_FEE: number = 60;

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
  private static paymentTotalInfoCalculate(data: {
    items: ProductsItemization[];
  }): {
    priceInfo: {
      price: number;
      memberPrice: number;
      vipPrice: number;
      svipPrice: number;
    };
    quantity: number;
  } {
    return data.items.reduce(
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
  private static paymentDeliveryFeeCalculate(): number {
    return PaymentService.DEFAULT_DELIVERY_FEE;
  }
  async payment(data: PaymentInput): Promise<string | null> {
    const settlementResult = await this.settlement(data.data);
    if (!settlementResult) {
      return null;
    }
    const MerchantTradeDate = moment().format('YYYY/MM/DD HH:mm:ss');
    const base_param = {
      MerchantTradeNo: data.paymentParams.merchantTradeNo, //請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
      MerchantTradeDate, //ex: 2017/02/13 15:45:30
      TotalAmount: data.paymentPrice.toString(),
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
            ? item.quantity
            : invoiceItem.InvoiceItemCount + `|${item.quantity}`,
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
      CustomerIdentifier: data.invoiceParams.customerIdentifier,
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
    };
    const create = new EcpayPayment(ecpayOptions);
    const html = create.payment_client.aio_check_out_credit_onetime(
      base_param,
      inv_params,
    );

    return String(html);
  }
  async settlement(data: SettlementInput): Promise<SettlementResult | null> {
    // Note: （會員系統）用戶資料、用戶紅利資料
    const memberLevel = userService.getUserMemberLevel({
      activation: data.userActivation,
    });

    // Note: (商品系統)
    const { items, anyProductNotExists } =
      await ProductService.productsItemization(data.products);
    if (anyProductNotExists) {
      return null;
    }

    // Note: (促銷系統）優惠資訊
    // TODO: 平台優惠、身份優惠、產品優惠

    // Note: （支付系統）價格計算
    // TODO: 價格計算
    const deliveryFee = PaymentService.paymentDeliveryFeeCalculate();
    const { priceInfo, quantity } = PaymentService.paymentTotalInfoCalculate({
      items,
    });
    const paymentPrice = PaymentService.paymentPriceCalculate({
      memberLevel,
      priceInfo,
    });
    const settleResult: SettlementResult = {
      items: items,
      quantity,
      deliveryFee,
      priceInfo,
      paymentPrice,
    };
    // Note: 將運費紀為一筆 item
    if (settleResult.deliveryFee > 0) {
      settleResult.items.push({
        productId: null,
        productSkuId: null,
        name: '運費',
        price: settleResult.deliveryFee,
        memberPrice: settleResult.deliveryFee,
        vipPrice: settleResult.deliveryFee,
        svipPrice: settleResult.deliveryFee,
        quantity: 1,
      });
      settleResult.quantity += 1;
      settleResult.priceInfo.price += settleResult.deliveryFee;
      settleResult.priceInfo.memberPrice += settleResult.deliveryFee;
      settleResult.priceInfo.vipPrice += settleResult.deliveryFee;
      settleResult.priceInfo.svipPrice += settleResult.deliveryFee;
    }

    // Note: （倉儲系統）庫存檢查、運費計算、庫存調整
    // TODO: 庫存檢查、運費計算、庫存調整

    // Note: 回傳結算結果
    return settleResult;
  }
}

export default new PaymentService();
