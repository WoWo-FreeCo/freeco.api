import dotenv from 'dotenv';
import config from './default';

process.env['NODE_CONFIG_DIR'] = __dirname;
dotenv.config();

export default config;
