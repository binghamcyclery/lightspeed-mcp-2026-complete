import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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

const SERVER_NAME = 'lightspeed-mcp-server';
const SERVER_VERSION = '1.0.0';

export class LightspeedMCPServer {
  private server: Server;
  private client: LightspeedClient;
  private tools: Array<Tool & { handler: (args: any) => Promise<any> }> = [];

  constructor(accountId: string, clientId: string, clientSecret: string, config?: any) {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new LightspeedClient({
      accountId,
      clientId,
      clientSecret,
      ...config,
    });

    this.setupTools();
    this.setupHandlers();
  }

  private setupTools() {
    // Register all tool categories
    this.tools.push(...(createProductTools(this.client) as any));
    this.tools.push(...(createCategoryTools(this.client) as any));
    this.tools.push(...(createCustomerTools(this.client) as any));
    this.tools.push(...(createSalesTools(this.client) as any));
    this.tools.push(...(createOrderTools(this.client) as any));
    this.tools.push(...(createInventoryTools(this.client) as any));
    this.tools.push(...(createVendorTools(this.client) as any));
    this.tools.push(...(createEmployeeTools(this.client) as any));
    this.tools.push(...(createRegisterTools(this.client) as any));
    this.tools.push(...(createManufacturerTools(this.client) as any));
    this.tools.push(...(createDiscountTools(this.client) as any));
    this.tools.push(...(createReportTools(this.client) as any));
    this.tools.push(...(createWorkorderTools(this.client) as any));
    this.tools.push(...(createShopTools(this.client) as any));
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.map(({ handler, ...tool }) => tool),
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.tools.find((t) => t.name === request.params.name);

      if (!tool) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      try {
        const result = await tool.handler(request.params.arguments || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error.message || 'Unknown error',
                details: error.details || error.toString(),
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
    console.error(`Total tools: ${this.tools.length}`);
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.client.setTokens(accessToken, refreshToken);
  }

  getClient() {
    return this.client;
  }
}
