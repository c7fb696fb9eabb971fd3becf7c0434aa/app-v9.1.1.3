import { serve } from '@hono/node-server';
import { app } from './app.js';
import { apiConfig } from './config.js';

serve({ fetch: app.fetch, port: apiConfig.port, hostname: '0.0.0.0' }, (info) => {
  console.info(`GreenDocs API listening on ${info.address}:${info.port}`);
});
