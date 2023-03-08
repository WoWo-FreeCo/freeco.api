import {
  DeliveryType,
  OrderRevokeInvoiceStatus,
  OrderRevokeLogisticsStatus,
  OrderRevokePaymentStatus,
  OrderStatus,
} from '@prisma/client';
import { ProductAttribute } from '.prisma/client';
import { WarehouseExpressCode } from '../../utils/one-warehouse/client/type/data';

export interface Order {
  id: string;
  orderStatus: OrderStatus;
  attribute: ProductAttribute;
  price: number;
  createdAt: Date;
}

export interface OrderDetail {
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

export interface OrderDetailsIncludesCoverImg extends OrderDetail {
  items: {
    productId: number | null;
    skuId: string | null;
    name: string;
    price: number;
    quantity: number;
    coverImg: string | null;
  }[];
}

export interface LogisticsDetail {
  id: string;
  outboundOrderId: string;
  packageInfos: {
    logisticsNo: string;
    expressNo: string;
    providerLogisticsCode: WarehouseExpressCode;
    deliveryType: 'HOME' | 'STORE';
  }[];
  outboundTime: Date | null;
  logisticsStatus: string;
}

export interface OrderRevokeInformation {
  id: string;
  revokeInformation: {
    invoiceStatus: OrderRevokeInvoiceStatus;
    paymentStatus: OrderRevokePaymentStatus;
    logisticsStatus: OrderRevokeLogisticsStatus;
  };
}
