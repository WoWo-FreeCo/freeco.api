export interface OneWarehouseBaseResponse<T> {
  trace_id: string;
  code: string;
  message: string;
  success: boolean;
  data: T;
}

export interface OrderTraceResponseData {
  // Note: 物流轨迹
  logistics_trace_events: {
    // Note: 轨迹事件编码
    event_code: string;
    // Note: 轨迹名称
    event_name: string;
    // Note: 轨迹事件描述
    event_remark: string;
    // Note: 轨迹事件时间戳
    event_time: string;
  }[];
}
export interface CreateResponseData {
  //Note: 上游唯一订单号
  order_no: string;
}

export interface CancelResponseData {
  // Note: true：取消成功 false：取消失败
  cancel_success: string;
  // Note: 失败原因
  error_msg: string;
  // Note: 上游唯一订单号
  order_no: string;
}

export interface DetailResponseData {
  // Note: 商品序列号
  imei_list: {
    // Note: 序列号
    imeis: string[];
    // Note: skuId
    sku_id: string;
  }[];
  // Note: 物流状态
  logistics_status: string;
  // Note: 上游唯一订单号
  order_no: string;
  // Note: 订单状态
  order_status: string;
  // Note: OW出库单号
  outbound_order_no: string;
  // Note: 出库时间
  outbound_time: string;
  // Note: 包裹信息
  package_infos: {
    // Note: "home", "宅配" "store", "超商取货"
    delivery_type: 'home' | 'store';
    // Note: 快递单号
    express_no: string;
    // Note: 物流单号
    logistics_no: string;
    // Note: 包裹商品明细
    package_commodities: {
      // Note: 批次及效期明细
      batches: {
        // Note: 批次号
        batch_id: string;
        // Note: 效期
        expire_date: number;
        // Note: 数量
        qty: number;
      }[];
      // Note: 出库数量
      qty: string;
      // Note: sku
      sku: string;
    }[];
    // Note: 仓配物流商编码
    provider_logistics_code: string;
    // Note: 仓库编码
    warehouse_code: string;
  }[];
}
