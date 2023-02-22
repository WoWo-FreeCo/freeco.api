import { Snowflake } from 'nodejs-snowflake';

const snowflakeId = new Snowflake({
  custom_epoch: 0,
  instance_id: 0,
});

const generateOrderId = (): string => {
  const uid = snowflakeId.getUniqueID().toString();
  return uid;
};

const generateMerchantTradeNo = (): string => {
  const uid = snowflakeId.getUniqueID().toString();
  return 'A' + uid;
};

const generateRelateNumber = (): string => {
  const uid = snowflakeId.getUniqueID().toString();
  return 'ABCDEFGHIJK' + uid;
};

export default {
  generateOrderId,
  generateMerchantTradeNo,
  generateRelateNumber,
};
