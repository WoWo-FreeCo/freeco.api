import { createServer } from './server';
import { Server } from 'net';

function main(): Server {
  const app = createServer();

  return app.listen(3000, () => {
    console.log('App is listening on 3000 port...');
  });
}

main();
