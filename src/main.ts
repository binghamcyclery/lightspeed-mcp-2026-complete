#!/usr/bin/env node

import { LightspeedMCPServer } from './server.js';

const accountId = process.env.LIGHTSPEED_ACCOUNT_ID;
const clientId = process.env.LIGHTSPEED_CLIENT_ID;
const clientSecret = process.env.LIGHTSPEED_CLIENT_SECRET;
const accessToken = process.env.LIGHTSPEED_ACCESS_TOKEN;
const refreshToken = process.env.LIGHTSPEED_REFRESH_TOKEN;
const apiType = process.env.LIGHTSPEED_API_TYPE || 'retail';
const environment = process.env.LIGHTSPEED_ENVIRONMENT || 'production';

if (!accountId || !clientId || !clientSecret) {
  console.error('Error: Missing required environment variables');
  console.error('Required: LIGHTSPEED_ACCOUNT_ID, LIGHTSPEED_CLIENT_ID, LIGHTSPEED_CLIENT_SECRET');
  process.exit(1);
}

const config: any = {
  apiType: apiType as 'retail' | 'restaurant',
  environment: environment as 'production' | 'trial',
};

if (accessToken) config.accessToken = accessToken;
if (refreshToken) config.refreshToken = refreshToken;

const server = new LightspeedMCPServer(accountId, clientId, clientSecret, config);

if (accessToken && refreshToken) {
  server.setTokens(accessToken, refreshToken);
}

const port = process.env.PORT;

if (port) {
  server.runHttp(parseInt(port)).catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
} else {
  server.run().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
