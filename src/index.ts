import { createServer } from './server';
import { Server } from 'net';
import prisma from './database/client/prisma';
import config from './config';

async function run(): Promise<Server> {
  const app = createServer();

  try {
    await prisma.$connect();
    console.log(`Connected to MySql Database.`);
  } catch (err) {
    await prisma.$disconnect();
    console.log(`Connected to MySql Database ${err}`);
    process.exit(1);
  }

  const port = config.API_PORT;
  return app.listen(port, () => {
    console.log(`App is listening on ${port} port...`);
  });
}

function main() {
  run().then();
}

main();
