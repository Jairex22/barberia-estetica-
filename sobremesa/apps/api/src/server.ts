import { buildApp } from './app.js';
import { config } from './config.js';

const app = await buildApp();
try {
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`API lista en ${config.API_PUBLIC_URL} (modo ${config.NODE_ENV}${config.DEMO_MODE ? ', DEMO' : ''})`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, async () => { await app.close(); process.exit(0); });
