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
import config from 'config';

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
    this._axiosClient.interceptors.response.use(
      (response) => {
        if (!response.data.success) {
          throw Error(
            `One Warehouse Client Error (${response.data.code}): ${response.data.message}`,
          );
        }
        return response;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
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

const url = config.get<string>('ONE_WAREHOUSE_URL');
const appId = config.get<string>('ONE_WAREHOUSE_APP_ID');
const auth2AccessToken = config.get<string>('ONE_WAREHOUSE_ACCESS_TOKEN');

export default new OneWarehouseClient(
  {
    url,
    appId,
    version: '1.0.0',
  },
  auth2AccessToken,
);
