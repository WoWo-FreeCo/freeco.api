import dotenv from 'dotenv';

dotenv.config();
export default {
  ENVIRONMENT: process.env.NODE_ENV,
  API_PORT: process.env.API_PORT,
};
