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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.map(({ handler, ...tool }) => tool),
      };
    });

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

  async runHttp(port: number) {
    const transports: Map<string, SSEServerTransport> = new Map();

    const httpServer = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', tools: this.tools.length }));
        return;
      }

      if (req.url === '/sse' && req.method === 'GET') {
  const transport = new SSEServerTransport('/messages', res);
  transports.set(transport.sessionId, transport);

  res.on('close', () => {
    transports.delete(transport.sessionId);
  });

  const freshServer = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );
  this.setupHandlersForServer(freshServer);
  await freshServer.connect(transport);
  console.error(`Client connected via SSE, session: ${transport.sessionId}`);
  return;
}
      }

      if (req.url?.startsWith('/messages') && req.method === 'POST') {
        const url = new URL(req.url, `http://localhost:${port}`);
        const sessionId = url.searchParams.get('sessionId');

        if (!sessionId || !transports.has(sessionId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid or missing sessionId' }));
          return;
        }

        const transport = transports.get(sessionId)!;
        await transport.handlePostMessage(req, res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    httpServer.listen(port, () => {
      console.error(`${SERVER_NAME} v${SERVER_VERSION} running on HTTP/SSE port ${port}`);
      console.error(`Total tools: ${this.tools.length}`);
      console.error(`SSE endpoint: http://localhost:${port}/sse`);
    });
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.client.setTokens(accessToken, refreshToken);
  }

  getClient() {
    return this.client;
  }
}
