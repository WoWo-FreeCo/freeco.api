// *PrismaClient* in long-running applications
// Please refer to the advice from prisma.io below,
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prismaclient-in-long-running-applications

import { PrismaClient } from '@prisma/client';
import config from '../../../config';

// add prisma to the NodeJS global type
interface CustomNodeJsGlobal extends Global {
  prisma: PrismaClient;
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal;

const prisma = new PrismaClient();

if (config.env === 'development') global.prisma = prisma;

export default prisma;
