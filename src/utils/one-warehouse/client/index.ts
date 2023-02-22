import axios, { AxiosInstance } from 'axios';
import {
  CancelResponseData,
  CreateResponseData,
  DetailResponseData,
  OneWarehouseBaseResponse,
  OrderTraceResponseData,
} from './type/response';
import {
  CancelData,
  CreateData,
  DetailData,
  OrderTraceData,
} from './type/data';

interface OneWarehouseParams {
  url: string;
  appId: string;
  version: string;
}

class OneWarehouseClient {
  private readonly _params: OneWarehouseParams;
  private readonly _axiosClient: AxiosInstance;

  constructor(params: OneWarehouseParams, auth2AccessToken: string) {
    this._params = params;
    this._axiosClient = axios.create({
      headers: {
        Authorization: `Bearer ${auth2AccessToken}`,
      },
    });
  }
  async orderTrace(data: OrderTraceData): Promise<OrderTraceResponseData> {
    const response = await this._axiosClient.post<
      OneWarehouseBaseResponse<OrderTraceResponseData>
    >(
      `${this._params.url}/v20210710/logistics/order/trace
`,
      {
        ...data,
        app_id: data.app_id || this._params.appId,
        version: data.version || this._params.version,
      },
    );
    return response.data.data;
  }

  async create(data: CreateData): Promise<CreateResponseData> {
    const response = await this._axiosClient.post<
      OneWarehouseBaseResponse<CreateResponseData>
    >(
      `${this._params.url}/v20210901/onewarehouse/outbound_order/create
`,
      {
        ...data,
        app_id: data.app_id || this._params.appId,
        version: data.version || this._params.version,
      },
    );
    return response.data.data;
  }

  async cancel(data: CancelData): Promise<CancelResponseData> {
    const response = await this._axiosClient.post<
      OneWarehouseBaseResponse<CancelResponseData>
    >(
      `${this._params.url}/v20210901/onewarehouse/outbound_order/cancel
`,
      {
        ...data,
        app_id: data.app_id || this._params.appId,
        version: data.version || this._params.version,
      },
    );
    return response.data.data;
  }

  async detail(data: DetailData): Promise<DetailResponseData> {
    const response = await this._axiosClient.post<
      OneWarehouseBaseResponse<DetailResponseData>
    >(
      `${this._params.url}/v20210901/onewarehouse/outbound_order/detail
`,
      {
        ...data,
        app_id: data.app_id || this._params.appId,
        version: data.version || this._params.version,
      },
    );
    return response.data.data;
  }
}

export default new OneWarehouseClient(
  {
    url: 'https://logistic-op-gw-sandbox.myshoplinestg.com',
    appId: 'KA042',
    version: '1.0.0',
  },
  'eyJhbGciOiJIUzUxMiJ9.eyJhcHBLZXkiOiI4MzEyOGY1ZGU4MThkYjY2ZGRkNGJhODVmNGQwY2ZjZWYwZDI3ZjA5Iiwic2VsbGVySWQiOiI1NzM2MDk4MjM1NTkzNTI5NDIyIiwic3RvcmVJZCI6IjU3MzYwOTgyMzU1OTM1Mjk0MjIiLCJ2ZXJzaW9uIjoidmVyc2lvbiIsImRvbWFpbiI6IiIsInRpbWVzdGFtcCI6MTY3Mjg3OTkyOTgyMSwiaXNzIjoieXNvdWwiLCJleHAiOjE3MDQ0MTU5Mjd9.B5Li9CotDk5Zvdw5yQe1T4UAPLdlBrnUkJj_W_0g63dWTeTp8GxhMVNpLhpV6OsIgQgVDC7hxXf_mRJ-ClAuyg',
);
