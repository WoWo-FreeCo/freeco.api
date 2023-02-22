import config from 'config';

const ecpayBaseOptions = {
  returnURL: config.get<string>('ECPAY_CHECK_OUT_RETURN_URL'),
  orderResultURL: config.has('ECPAY_CHECK_OUT_ORDER_RESULT_URL')
    ? config.get<string>('ECPAY_CHECK_OUT_ORDER_RESULT_URL')
    : '',
  clientBackURL: config.has('ECPAY_CHECK_OUT_CLIENT_BACK_URL')
    ? config.get<string>('ECPAY_CHECK_OUT_CLIENT_BACK_URL')
    : '',
};

export default ecpayBaseOptions;
