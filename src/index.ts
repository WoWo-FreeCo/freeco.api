import { createServer } from './server';
import { Server } from 'net';
import prisma from './database/client/prisma';

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

  return app.listen(3000, () => {
    console.log('App is listening on 3000 port...');
  });
}

function main() {
  run().then();
}

main();
