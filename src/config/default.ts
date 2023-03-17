export default {
  isDevelopment: process.env.NODE_ENV == 'development',
  ENVIRONMENT: process.env.NODE_ENV,
  API_PORT: process.env.API_PORT,
  STATIC_DIR: process.cwd() + process.env.STATIC_DIR,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_PRIVATE_KEY: process.env.ACCESS_TOKEN_PRIVATE_KEY,
  ACCESS_TOKEN_PUBLIC_KEY: process.env.ACCESS_TOKEN_PUBLIC_KEY,
  REFRESH_TOKEN_PRIVATE_KEY: process.env.REFRESH_TOKEN_PRIVATE_KEY,
  REFRESH_TOKEN_PUBLIC_KEY: process.env.REFRESH_TOKEN_PUBLIC_KEY,
  ADMIN_ACCESS_TOKEN_EXPIRES_IN: process.env.ADMIN_ACCESS_TOKEN_EXPIRES_IN,
  ADMIN_REFRESH_TOKEN_EXPIRES_IN: process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN,
  ADMIN_ACCESS_TOKEN_PRIVATE_KEY: process.env.ADMIN_ACCESS_TOKEN_PRIVATE_KEY,
  ADMIN_ACCESS_TOKEN_PUBLIC_KEY: process.env.ADMIN_ACCESS_TOKEN_PUBLIC_KEY,
  ADMIN_REFRESH_TOKEN_PRIVATE_KEY: process.env.ADMIN_REFRESH_TOKEN_PRIVATE_KEY,
  ADMIN_REFRESH_TOKEN_PUBLIC_KEY: process.env.ADMIN_REFRESH_TOKEN_PUBLIC_KEY,
  // ECPay global variables
  ECPAY_OPERATION_MODE: process.env.ECPAY_OPERATION_MODE,
  ECPAY_MERCHANT_ID: process.env.ECPAY_MERCHANT_ID,
  ECPAY_HASH_KEY: process.env.ECPAY_HASH_KEY,
  ECPAY_HASH_IV: process.env.ECPAY_HASH_IV,
  // ECPay check-out variables
  ECPAY_CHECK_OUT_RETURN_URL: process.env.ECPAY_CHECK_OUT_RETURN_URL,
  ECPAY_CHECK_OUT_ORDER_RESULT_URL:
    process.env.ECPAY_CHECK_OUT_ORDER_RESULT_URL,
  ECPAY_CHECK_OUT_CLIENT_BACK_URL: process.env.ECPAY_CHECK_OUT_CLIENT_BACK_URL,
  ONE_WAREHOUSE_URL: process.env.ONE_WAREHOUSE_URL,
  ONE_WAREHOUSE_APP_ID: process.env.ONE_WAREHOUSE_APP_ID,
  ONE_WAREHOUSE_ACCESS_TOKEN: process.env.ONE_WAREHOUSE_ACCESS_TOKEN,

  // mailgun domain
  MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN,
  // mailgun key
  MAILGUN_KEY: process.env.MAILGUN_KEY,
  // host
  HOST: process.env.HOST,
  // 前台網址
  CLIENT_HOST: process.env.CLIENT_HOST,
  // 網站名稱
  CLIENT_HOST_NAME: process.env.CLIENT_HOST_NAME,
  // email hash SECRET
  EMAIL_HASH_SECRET: process.env.EMAIL_HASH_SECRET,
  // google 三方登入 id
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  // google secret
  GOOGLE_SECRET: process.env.GOOGLE_CLIENT_ID,
  // mail domain (寄信網址)
  MAIL_DOMAIN: process.env.MAIL_DOMAIN,
  // sendinblue key
  SENDINBLUE_KEY: process.env.SENDINBLUE_KEY,
  // facebook app id
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  // facebook oauth secret
  FACEBOOK_SECRET: process.env.FACEBOOK_SECRET,
  // facebook api version
  FACEBOOK_DEFAULT_GRAPH_VERSION: process.env.FACEBOOK_DEFAULT_GRAPH_VERSION,
};
