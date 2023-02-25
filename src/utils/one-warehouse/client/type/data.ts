export interface OrderTraceData {
  // Note: 应用唯一标识，由OpenApi给到调用方
  app_id?: string;
  // Note: 物流单号
  logistics_no: string;
  // Note: 时间戳
  timestamp: string;
  // Note: 版本号
  version?: string;
}
export interface CreateData {
  // Note: 地址信息
  address_info: {
    // Note: 收件方详细地址（请勿包含国家、城市、区县）， 如:民生东路三段156号
    consignee_address?: string;
    // Note: 收件详细地址2
    consignee_address_two?: string;
    // Note: 收件方所在城市名称，必须是标准的城市称谓
    consignee_city?: string;
    // Note: 收件放国家或地区代码（代码由OneWarehouse提供）
    consignee_country_code?: string;
    // Note: 收件方所在县/区级行政区名称，必须是标准的县/区称谓， 如：松山区，九龙区等
    consignee_district?: string;
    // Note: 收件人邮箱
    consignee_email?: string;
    // Note: 收件人证件号
    consignee_id_no?: string;
    // Note: 证件类型：1身份证,2护照,3港澳通行证,4回乡证,5台胞证,6赴台通行证,7其它
    consignee_id_type?: string;
    // Note: 收件人手机
    consignee_mobile?: string;
    // Note: 收件方联系人
    consignee_name?: string;
    // Note: 收件方所在省级行政区名称，必须是标准的省级行政区名称 如：北京、广东省等；
    consignee_province?: string;
    // Note: 收件备注
    consignee_remark?: string;
    // Note: 收件门店编码（配送类型：店配，必填）
    consignee_station_code?: string;
    // Note: 收件门店名称（配送类型：店配，必填）
    consignee_station_name?: string;
    // Note: 收件街镇
    consignee_town?: string;
    // Note: 收件邮编
    consignee_zip_code?: string;
    // Note: 寄件备注
    sender_remark?: string;
  };
  app_id?: string;
  // Note: 基础信息
  basic_info: {
    //Note: 上游唯一订单号
    order_no: string;
  };
  // Note: 服务产品信息
  express_type_info: {
    // Note: 配送类型，1：宅配 4：店配
    delivery_type: number;
    // Note: 预计到货日期，如["2022-08-23"]
    required_delivery_dates?: string[];
    // Note: 预计到货时段，如["14:00-18:00"]
    required_delivery_timeslots?: string[];
    // Note: 仓配物流编码
    warehouse_express_code: WarehouseExpressCode;
  };
  // Note: 费用信息
  fee_info: {
    // Note: 代收货款金额
    cod_amount?: number;
    // Note: 币种
    currency_code?: string;
  };
  // Note: 包裹信息
  package_info: {
    // Note: 包裹托寄物信息
    package_commodity_info_list: {
      // Note: 商品编码
      item_code: string;
      // Note: 商品英文名称
      item_ename?: string;
      // Note: 商品名称
      item_name: string;
      // Note: 商品单价 (此數量以0.01為最小單位，若要輸入整數，傳入時需乘以100)
      item_price: number;
      // Note: 商品数量
      quantity: number;
    }[];
  };
  // Note: 毫秒级时间戳
  timestamp: string;
  // Note: 版本号
  version?: string;
  // Note: 仓库信息
  warehouse_info?: {
    // Note: 仓库编码（测试环境仓库编码：OPENAPI，正式环境仓库编码由业务人员提供）
    warehouse_id: string;
  };
}

export interface CancelData {
  // Note: appId，必填
  app_id?: string;
  // Note: 上游唯一订单号，必填
  order_no: string;
  // Note: 毫秒级时间戳，必填
  timestamp: string;
  // Note: 版本号，必填。可填写1.0.0
  version?: string;
}

export interface DetailData {
  // Note: appId，必填
  app_id?: string;
  // Note: 上游唯一订单号，必填
  order_no: string;
  // Note: 毫秒级时间戳，必填
  timestamp: string;
  // Note: 版本号，必填。可填写1.0.0
  version?: string;
}

export enum WarehouseExpressCode {
  // Note: 711B2C
  '711B2C-OW' = '711B2C-OW',
  // Note: 711跨境
  '711-INTL-OW' = '711-INTL-OW',
  // Note: 全家B2C
  'FMTB2C-OW' = 'FMTB2C-OW',
  // Note: 黑猫-常温
  'CAT_HOME_ROOMTEMP-OW' = 'CAT_HOME_ROOMTEMP-OW',
  // Note: 黑猫-冷藏
  'CAT_HOME_REFRIGERATED-OW' = 'CAT_HOME_REFRIGERATED-OW',
  // Note: 黑猫-冷冻
  'CAT_HOME_FROZEN-OW' = 'CAT_HOME_FROZEN-OW',
  // Note: 新竹-常温
  'hct_roomtemp-OW' = 'hct_roomtemp-OW',
  // Note: 新竹-冷藏
  'hct_refrigerated-OW' = 'hct_refrigerated-OW',
  // Note: 新竹-冷冻
  'hct_frozen-OW' = 'hct_frozen-OW',
}
