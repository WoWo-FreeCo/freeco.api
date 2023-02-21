import config from 'config';

const ecpayBaseOptions = {
  ReturnURL: config.get<string>('ECPAY_CHECK_OUT_RETURN_URL'),
};

export default ecpayBaseOptions;
