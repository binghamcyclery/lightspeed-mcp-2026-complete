import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { LightspeedClient } from './clients/lightspeed.js';
import { createProductTools } from './tools/products.js';
import { createCategoryTools } from './tools/categories.js';
import { createCustomerTools } from './tools/customers.js';
import { createSalesTools } from './tools/sales.js';
import { createOrderTools } from './tools/orders.js';
import { createInventoryTools } from './tools/inventory.js';
import { createVendorTools } from './tools/vendors.js';
import { createEmployeeTools } from './tools/employees.js';
import { createRegisterTools } from './tools/registers.js';
import { createManufacturerTools } from './tools/manufacturers.js';
import { createDiscountTools } from './tools/discounts.js';
import { createReportTools } from './tools/reports.js';
import { createWorkorderTools } from './tools/workorders.js';
import { createShopTools } from './tools/shops.js';
import http from 'http';

const SERVER_NAME = 'lightspeed-mcp-server';
const SERVER_VERSION = '1.0.0';

export class LightspeedMCPServer {
  private server: Server;
  private client: LightspeedClient;
  private tools: Array<Tool & { handler: (args: any) => Promise<any> }> = [];

  constructor(accountId: string, clientId: string, clientSecret: string, config?: any) {
    this.server = new Server(
      { name: SERVER_NAME, version: SERVER_VERSION },
      { capabilities: { tools: {} } }
    );

    this.client = new LightspeedClient({
      accountId,
      clientId,
      clientSecret,
      ...config,
    });

    this.setupTools();
    this.setupHandlersForServer(this.server);
  }

  private setupTools() {
    this.tools.push(...(createProduct
