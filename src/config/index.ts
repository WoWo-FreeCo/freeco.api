import dotenv from 'dotenv';

dotenv.config();
export default {
  isDevelopment: process.env.NODE_ENV == 'development',
  ENVIRONMENT: process.env.NODE_ENV,
  API_PORT: process.env.API_PORT,
};
