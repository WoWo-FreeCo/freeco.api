import prisma from '../../database/client/prisma';
import snowflakeId from '../../utils/snowflake-id';
import { Order, OrderConsignee, OrderItem } from '@prisma/client';
import OneWarehouseClient from '../../utils/one-warehouse/client';
import { WarehouseExpressCode } from '../../utils/one-warehouse/client/type/data';
import { ProductAttribute } from '.prisma/client';
import { Pagination } from '../../utils/helper/pagination';
export interface Timeslot {
  date: Date;
  slot: string;
}
interface CreateOrderInput {
  userId: string;
  price: number;
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
  items: {
    productId: number;
    productSkuId: string | null;
    name: string;
    price: number;
    quantity: number;
  }[];
}

interface GetOrdersInput {
  attribute?: ProductAttribute;
  pagination: Pagination;
}

interface IOrderService {
  createOrder(data: CreateOrderInput): Promise<Order>;
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
    return prisma.order.create({
      data: {
        userId: data.userId,
        id: orderId,
        merchantTradeNo,
        relateNumber,
        orderStatus: 'WAIT_PAYMENT',
        price: data.price,
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
            data: data.items.filter((item) => item.productId !== -1),
          },
        },
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
    | (Order & { consignee: OrderConsignee | null; orderItems: OrderItem[] })
    | null
  > {
    return prisma.order.findFirst({
      where: {
        merchantTradeNo: data.merchantTradeNo,
      },
      include: {
        consignee: true,
        orderItems: true,
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
        package_commodity_info_list: data.orderItems.map((item) => ({
          item_code: item.productSkuId?.toString() || 'ERROR_SKU_ID',
          item_name: item.name,
          item_price: item.price,
          quantity: item.quantity,
        })),
      },
      timestamp: '0',
    });
  }
}

export default new OrderService();
