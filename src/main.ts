#!/usr/bin/env node

import { LightspeedMCPServer } from './server.js';

// Get configuration from environment variables
const accountId = process.env.LIGHTSPEED_ACCOUNT_ID;
const clientId = process.env.LIGHTSPEED_CLIENT_ID;
const clientSecret = process.env.LIGHTSPEED_CLIENT_SECRET;
const accessToken = process.env.LIGHTSPEED_ACCESS_TOKEN;
const refreshToken = process.env.LIGHTSPEED_REFRESH_TOKEN;
const apiType = process.env.LIGHTSPEED_API_TYPE || 'retail'; // retail or restaurant
const environment = process.env.LIGHTSPEED_ENVIRONMENT || 'production'; // production or trial

if (!accountId || !clientId || !clientSecret) {
  console.error('Error: Missing required environment variables');
  console.error('Required: LIGHTSPEED_ACCOUNT_ID, LIGHTSPEED_CLIENT_ID, LIGHTSPEED_CLIENT_SECRET');
  console.error('Optional: LIGHTSPEED_ACCESS_TOKEN, LIGHTSPEED_REFRESH_TOKEN, LIGHTSPEED_API_TYPE, LIGHTSPEED_ENVIRONMENT');
  process.exit(1);
}

const config: any = {
  apiType: apiType as 'retail' | 'restaurant',
  environment: environment as 'production' | 'trial',
};

if (accessToken) {
  config.accessToken = accessToken;
}

if (refreshToken) {
  config.refreshToken = refreshToken;
}

const server = new LightspeedMCPServer(accountId, clientId, clientSecret, config);

// Set tokens if provided
if (accessToken && refreshToken) {
  server.setTokens(accessToken, refreshToken);
}

server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
