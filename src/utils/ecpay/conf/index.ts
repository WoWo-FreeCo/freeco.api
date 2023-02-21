import config from 'config';

const ecpayOptions = {
  OperationMode: config.has('ECPAY_OPERATION_MODE')
    ? config.get<string>('ECPAY_OPERATION_MODE')
    : 'Test',
  MercProfile: {
    MerchantID: config.get<string>('ECPAY_MERCHANT_ID'),
    HashKey: config.get<string>('ECPAY_HASH_KEY'),
    HashIV: config.get<string>('ECPAY_HASH_IV'),
  },
  IgnorePayment: [
    //    "Credit",
    //    "WebATM",
    //    "ATM",
    //    "CVS",
    //    "BARCODE",
    //    "AndroidPay"
  ],
  IsProjectContractor: false,
};

export default ecpayOptions;
