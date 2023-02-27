import prisma from '../../database/client/prisma';
import snowflakeId from '../../utils/snowflake-id';
import {
  Order,
  OrderConsignee,
  OrderInvoiceInfo,
  OrderItem,
  OrderStatus,
} from '@prisma/client';
import OneWarehouseClient from '../../utils/one-warehouse/client';
import { WarehouseExpressCode } from '../../utils/one-warehouse/client/type/data';
import { ProductAttribute } from '.prisma/client';
import { Pagination } from '../../utils/helper/pagination';
import { ItemPayment } from './PaymentService';
export interface Timeslot {
  date: Date;
  slot: string;
}
interface CreateOrderInput {
  userId: string;
  paymentPrice: number;
  attribute: ProductAttribute;
  consignee: {
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
  };
  invoiceInfo: {
    customerID?: string;
    // Note: 統一編號 固定 8 位長度數字
    customerIdentifier?: string;
    customerName?: string;
    customerAddr?: string;
    customerPhone?: string;
    customerEmail?: string;
    clearanceMark?: '' | '1' | '2';
    print: '0' | '1';
    // Note: 是否捐揍發票: 不捐贈: 0; 捐贈:1
    donation: '0' | '1';
    // Note: 受捐贈愛心碼
    loveCode?: string;
    // Note:
    // 當 `carruerType` 為 ""(無載具) 或 "1"(會員載具), `carruerNum`為空字串
    // 當 `carruerType` 為 "2"(自然人憑證), `carruerNum`格式:長度16,前2碼為大小寫字母,後14碼為數字
    // 當 `carruerType` 為 "3"(手機條碼), `carruerNum`格式:長度8,前1碼為'/',後7碼為數字或大小寫字母
    carruerType?: '' | '1' | '2' | '3';
    carruerNum?: string;
    taxType: '1' | '2' | '3' | '9';
    remark?: string;
    // Note: 字軌類別，、'07'一般稅額
    invType: '07';
    // Note: 商品單價是否含稅，'1'為含稅價'、'2'為未稅價
    vat: '1';
  };
  items: ItemPayment[];
}

interface GetOrdersInput {
  attribute?: ProductAttribute;
  pagination: Pagination;
}

export enum CancelOrderResultCode {
  SUCCESS = 'success',
  CO001 = 'CO-001',
  CO002 = 'CO-002',
}
interface CancelOrderResult {
  code: CancelOrderResultCode;
}

interface IOrderService {
  createOrder(data: CreateOrderInput): Promise<Order>;
  cancelOrderFromWaitPayment(data: { id: string }): Promise<CancelOrderResult>;
  revokeOrderFromWaitDelivery(data: { id: string }): Promise<CancelOrderResult>;
  completeOrderPaymentFromWaitDelivery(data: { id: string }): Promise<boolean>;
  revokeOrderFromWaitPayment(data: { id: string }): Promise<boolean>;
  getOrderById(data: {
    id: string;
    restrict?: {
      userId: string;
    };
  }): Promise<Order | null>;
  getOrders(
    data: GetOrdersInput & {
      restrict?: {
        userId: string;
      };
    },
  ): Promise<Order[]>;
  getOrderDetailById(data: {
    id: string;
    restrict?: {
      userId: string;
    };
  }): Promise<
    | (Order & { consignee: OrderConsignee | null; orderItems: OrderItem[] })
    | null
  >;

  getOrderDetailByMerchantTradeNo(data: {
    merchantTradeNo: string;
  }): Promise<
    | (Order & { consignee: OrderConsignee | null; orderItems: OrderItem[] })
    | null
  >;
  createOutboundOrder(data: {
    order: Order;
    consignee: OrderConsignee;
    orderItems: OrderItem[];
  }): Promise<void>;
}

class OrderService implements IOrderService {
  private readonly DEFAULT_COUNTRY_CODE = 'TW';
  private readonly DEFAULT_CURRENCY_CODE = 'TWD';
  async createOrder(data: CreateOrderInput): Promise<Order> {
    const orderId = snowflakeId.generateOrderId();
    const merchantTradeNo = snowflakeId.generateMerchantTradeNo();
    const relateNumber = snowflakeId.generateRelateNumber();
    const invoiceItem = data.items.reduce(
      (result, item) => ({
        ...result,
        itemName:
          result.itemName === ''
            ? item.name
            : result.itemName + `|${item.name}`,
        itemCount:
          result.itemCount === ''
            ? item.quantity.toString()
            : result.itemCount + `|${item.quantity}`,
        itemWord: result.itemWord === '' ? `個` : result.itemWord + `|個`,
        itemPrice:
          result.itemPrice === ''
            ? item.paymentPrice.toString()
            : result.itemPrice + `|${item.paymentPrice}`,
        itemAmount:
          result.itemAmount === ''
            ? (item.paymentPrice * item.quantity).toString()
            : result.itemAmount + `|${item.paymentPrice * item.quantity}`,
      }),
      {
        itemName: '',
        itemCount: '',
        itemWord: '',
        itemPrice: '',
        itemTaxType: '',
        itemAmount: '',
        itemRemark: '',
      },
    );
    return prisma.order.create({
      data: {
        userId: data.userId,
        id: orderId,
        merchantTradeNo,
        relateNumber,
        orderStatus: 'WAIT_PAYMENT',
        price: data.paymentPrice,
        attribute: data.attribute,
        consignee: {
          create: {
            deliveryType: data.consignee.deliveryType,
            addressDetailOne: data.consignee.addressDetailOne,
            addressDetailTwo: data.consignee.addressDetailTwo,
            city: data.consignee.city,
            district: data.consignee.district,
            email: data.consignee.email,
            idNo: data.consignee.idNo,
            idType: data.consignee.idType,
            cellphone: data.consignee.cellphone,
            name: data.consignee.name,
            province: data.consignee.province,
            remark: data.consignee.remark,
            stationCode: data.consignee.stationCode,
            stationName: data.consignee.stationName,
            town: data.consignee.town,
            zipCode: data.consignee.zipCode,
            senderRemark: data.consignee.senderRemark,
            countryCode: this.DEFAULT_COUNTRY_CODE,
            requiredDeliveryDates: '',
            requiredDeliveryTimeslots: '',
            codAmount: 0,
            currencyCode: this.DEFAULT_CURRENCY_CODE,
          },
        },
        orderItems: {
          createMany: {
            data: data.items.map((i) => ({
              name: i.name,
              productId: i.productId,
              productSkuId: i.productSkuId,
              quantity: i.quantity,
              price: i.paymentPrice,
            })),
          },
        },
        invoiceInfo: {
          create: {
            customerID: data.invoiceInfo.customerID,
            customerIdentifier: data.invoiceInfo.customerIdentifier,
            customerName: data.invoiceInfo.customerName,
            customerAddr: data.invoiceInfo.customerAddr,
            customerPhone: data.invoiceInfo.customerPhone,
            customerEmail: data.invoiceInfo.customerEmail,
            print: data.invoiceInfo.print,
            donation: data.invoiceInfo.donation,
            loveCode: data.invoiceInfo.loveCode,
            carruerType: data.invoiceInfo.carruerType,
            carruerNum: data.invoiceInfo.carruerNum,
            taxType: data.invoiceInfo.taxType,
            remark: data.invoiceInfo.remark,
            invType: '07',
            salesAmount: data.paymentPrice.toString(),
            vat: data.invoiceInfo.vat,
            ...invoiceItem,
          },
        },
      },
    });
  }

  async cancelOrderFromWaitPayment(data: {
    id: string;
  }): Promise<CancelOrderResult> {
    const result = await prisma.order.updateMany({
      where: {
        id: data.id,
        orderStatus: OrderStatus.WAIT_PAYMENT,
      },
      data: {
        orderStatus: OrderStatus.CANCELLED,
      },
    });
    if (result.count === 0) {
      return {
        code: CancelOrderResultCode.CO001,
      };
    }

    return {
      code: CancelOrderResultCode.SUCCESS,
    };
  }
  async revokeOrderFromWaitDelivery(data: {
    id: string;
  }): Promise<CancelOrderResult> {
    const result = await prisma.order.updateMany({
      where: {
        id: data.id,
        orderStatus: OrderStatus.WAIT_DELIVER,
      },
      data: {
        orderStatus: OrderStatus.REVOKED,
      },
    });
    if (result.count === 0) {
      return {
        code: CancelOrderResultCode.CO002,
      };
    }

    return {
      code: CancelOrderResultCode.SUCCESS,
    };
  }
  async completeOrderPaymentFromWaitDelivery(data: {
    id: string;
  }): Promise<boolean> {
    const result = await prisma.order.updateMany({
      where: {
        id: data.id,
        orderStatus: OrderStatus.WAIT_PAYMENT,
      },
      data: {
        orderStatus: OrderStatus.WAIT_DELIVER,
      },
    });

    return result.count === 1;
  }

  async revokeOrderFromWaitPayment(data: { id: string }): Promise<boolean> {
    const result = await prisma.order.updateMany({
      where: {
        id: data.id,
        orderStatus: OrderStatus.WAIT_PAYMENT,
      },
      data: {
        orderStatus: OrderStatus.REVOKED,
      },
    });

    return result.count === 1;
  }
  async getOrderById(data: {
    id: string;
    restrict?: { userId: string };
  }): Promise<Order | null> {
    return prisma.order.findFirst({
      where: {
        id: data.id,
        userId: data.restrict?.userId,
      },
    });
  }
  async getOrders(
    data: GetOrdersInput & {
      restrict?: {
        userId: string;
      };
    },
  ): Promise<Order[]> {
    const {
      attribute,
      pagination: { take, skip },
    } = data;
    return prisma.order.findMany({
      where: {
        attribute,
        userId: data.restrict?.userId,
      },
      take,
      skip,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async getOrderDetailById(data: {
    id: string;
    restrict?: {
      userId: string;
    };
  }): Promise<
    | (Order & { consignee: OrderConsignee | null; orderItems: OrderItem[] })
    | null
  > {
    return prisma.order.findFirst({
      where: {
        id: data.id,
        userId: data.restrict?.userId,
      },
      include: {
        consignee: true,
        orderItems: true,
      },
    });
  }
  async getOrderDetailByMerchantTradeNo(data: {
    merchantTradeNo: string;
  }): Promise<
    | (Order & {
        consignee: OrderConsignee | null;
        orderItems: OrderItem[];
        invoiceInfo: OrderInvoiceInfo | null;
      })
    | null
  > {
    return prisma.order.findFirst({
      where: {
        merchantTradeNo: data.merchantTradeNo,
      },
      include: {
        consignee: true,
        orderItems: true,
        invoiceInfo: true,
      },
    });
  }
  async createOutboundOrder(data: {
    order: Order;
    consignee: OrderConsignee;
    orderItems: OrderItem[];
  }): Promise<void> {
    await OneWarehouseClient.create({
      address_info: {
        consignee_address: data.consignee.addressDetailOne || undefined,
        consignee_address_two: data.consignee.addressDetailTwo || undefined,
        consignee_city: data.consignee.city || undefined,
        consignee_country_code: data.consignee.countryCode || undefined,
        consignee_district: data.consignee.district || undefined,
        consignee_email: data.consignee.email || undefined,
        consignee_id_no: data.consignee.idNo || undefined,
        consignee_id_type: data.consignee.idType || undefined,
        consignee_mobile: data.consignee.cellphone || undefined,
        consignee_name: data.consignee.name || undefined,
        consignee_province: data.consignee.province || undefined,
        consignee_remark: data.consignee.remark || undefined,
        consignee_station_code: data.consignee.stationCode || undefined,
        consignee_station_name: data.consignee.stationName || undefined,
        consignee_town: data.consignee.town || undefined,
        consignee_zip_code: data.consignee.zipCode || undefined,
        sender_remark: data.consignee.senderRemark || undefined,
      },
      basic_info: {
        order_no: data.order.id,
      },
      express_type_info: {
        delivery_type: data.consignee.deliveryType === 'HOME' ? 1 : 4,
        warehouse_express_code: WarehouseExpressCode['hct_roomtemp-OW'],
      },
      fee_info: {
        cod_amount: data.consignee.codAmount || undefined,
        currency_code: data.consignee.currencyCode,
      },
      package_info: {
        package_commodity_info_list: data.orderItems
          .filter((item) => !!item.productId)
          .map((item) => ({
            item_code: item.productSkuId?.toString() || 'ERROR_SKU_ID',
            item_name: item.name,
            item_price: item.price * 100,
            quantity: item.quantity,
          })),
      },
      timestamp: Date.now().toString(),
    });
  }
}

export default new OrderService();
