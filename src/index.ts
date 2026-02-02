#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ============================================
// LIGHTSPEED RETAIL (R-SERIES) MCP SERVER
// API Docs: https://developers.lightspeedhq.com/retail/
// ============================================
const MCP_NAME = "lightspeed";
const MCP_VERSION = "1.0.0";
const API_BASE_URL = "https://api.lightspeedapp.com/API/V3/Account";

// ============================================
// API CLIENT - OAuth2 Authentication
// ============================================
class LightspeedClient {
  private accessToken: string;
  private accountId: string;
  private baseUrl: string;

  constructor(accessToken: string, accountId: string) {
    this.accessToken = accessToken;
    this.accountId = accountId;
    this.baseUrl = `${API_BASE_URL}/${accountId}`;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}.json`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lightspeed API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async get(endpoint: string, params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`${endpoint}${queryString}`, { method: "GET" });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

// ============================================
// TOOL DEFINITIONS
// ============================================
const tools = [
  {
    name: "list_sales",
    description: "List sales/transactions from Lightspeed Retail. Returns completed sales with line items, payments, and customer info.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max sales to return (default 100, max 100)" },
        offset: { type: "number", description: "Pagination offset" },
        completed: { type: "boolean", description: "Filter by completed status" },
        timeStamp: { type: "string", description: "Filter by timestamp (e.g., '>=,2024-01-01' or '<=,2024-12-31')" },
        employeeID: { type: "string", description: "Filter by employee ID" },
        shopID: { type: "string", description: "Filter by shop/location ID" },
        load_relations: { type: "string", description: "Comma-separated relations to load (e.g., 'SaleLines,SalePayments,Customer')" },
      },
    },
  },
  {
    name: "get_sale",
    description: "Get a specific sale by ID with full details including line items, payments, and customer",
    inputSchema: {
      type: "object" as const,
      properties: {
        sale_id: { type: "string", description: "Sale ID" },
        load_relations: { type: "string", description: "Comma-separated relations (e.g., 'SaleLines,SalePayments,Customer,SaleLines.Item')" },
      },
      required: ["sale_id"],
    },
  },
  {
    name: "list_items",
    description: "List inventory items from Lightspeed Retail catalog",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max items to return (default 100, max 100)" },
        offset: { type: "number", description: "Pagination offset" },
        categoryID: { type: "string", description: "Filter by category ID" },
        manufacturerID: { type: "string", description: "Filter by manufacturer ID" },
        description: { type: "string", description: "Search by description (supports ~ for contains)" },
        upc: { type: "string", description: "Filter by UPC barcode" },
        customSku: { type: "string", description: "Filter by custom SKU" },
        archived: { type: "boolean", description: "Include archived items" },
        load_relations: { type: "string", description: "Comma-separated relations (e.g., 'ItemShops,Category,Manufacturer')" },
      },
    },
  },
  {
    name: "get_item",
    description: "Get a specific inventory item by ID with full details",
    inputSchema: {
      type: "object" as const,
      properties: {
        item_id: { type: "string", description: "Item ID" },
        load_relations: { type: "string", description: "Comma-separated relations (e.g., 'ItemShops,Category,Manufacturer,Prices')" },
      },
      required: ["item_id"],
    },
  },
  {
    name: "update_inventory",
    description: "Update inventory quantity for an item at a specific shop location",
    inputSchema: {
      type: "object" as const,
      properties: {
        item_shop_id: { type: "string", description: "ItemShop ID (the item-location relationship ID)" },
        qoh: { type: "number", description: "New quantity on hand" },
        reorderPoint: { type: "number", description: "Reorder point threshold" },
        reorderLevel: { type: "number", description: "Reorder quantity level" },
      },
      required: ["item_shop_id", "qoh"],
    },
  },
  {
    name: "list_customers",
    description: "List customers from Lightspeed Retail",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max customers to return (default 100, max 100)" },
        offset: { type: "number", description: "Pagination offset" },
        firstName: { type: "string", description: "Filter by first name (supports ~ for contains)" },
        lastName: { type: "string", description: "Filter by last name (supports ~ for contains)" },
        email: { type: "string", description: "Filter by email address" },
        phone: { type: "string", description: "Filter by phone number" },
        customerTypeID: { type: "string", description: "Filter by customer type ID" },
        load_relations: { type: "string", description: "Comma-separated relations (e.g., 'Contact,CustomerType')" },
      },
    },
  },
  {
    name: "list_categories",
    description: "List product categories from Lightspeed Retail catalog",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max categories to return (default 100, max 100)" },
        offset: { type: "number", description: "Pagination offset" },
        parentID: { type: "string", description: "Filter by parent category ID (0 for root categories)" },
        name: { type: "string", description: "Filter by category name (supports ~ for contains)" },
        load_relations: { type: "string", description: "Comma-separated relations (e.g., 'Items')" },
      },
    },
  },
  {
    name: "get_register",
    description: "Get register/POS terminal information and status",
    inputSchema: {
      type: "object" as const,
      properties: {
        register_id: { type: "string", description: "Register ID (optional - lists all if not provided)" },
        shopID: { type: "string", description: "Filter by shop/location ID" },
        load_relations: { type: "string", description: "Comma-separated relations (e.g., 'Shop,RegisterCounts')" },
      },
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================
async function handleTool(client: LightspeedClient, name: string, args: any) {
  switch (name) {
    case "list_sales": {
      const params: Record<string, string> = {};
      if (args.limit) params.limit = String(args.limit);
      if (args.offset) params.offset = String(args.offset);
      if (args.completed !== undefined) params.completed = args.completed ? 'true' : 'false';
      if (args.timeStamp) params.timeStamp = args.timeStamp;
      if (args.employeeID) params.employeeID = args.employeeID;
      if (args.shopID) params.shopID = args.shopID;
      if (args.load_relations) params.load_relations = `["${args.load_relations.split(',').join('","')}"]`;
      return await client.get("/Sale", params);
    }

    case "get_sale": {
      const params: Record<string, string> = {};
      if (args.load_relations) params.load_relations = `["${args.load_relations.split(',').join('","')}"]`;
      return await client.get(`/Sale/${args.sale_id}`, params);
    }

    case "list_items": {
      const params: Record<string, string> = {};
      if (args.limit) params.limit = String(args.limit);
      if (args.offset) params.offset = String(args.offset);
      if (args.categoryID) params.categoryID = args.categoryID;
      if (args.manufacturerID) params.manufacturerID = args.manufacturerID;
      if (args.description) params.description = args.description;
      if (args.upc) params.upc = args.upc;
      if (args.customSku) params.customSku = args.customSku;
      if (args.archived !== undefined) params.archived = args.archived ? 'true' : 'false';
      if (args.load_relations) params.load_relations = `["${args.load_relations.split(',').join('","')}"]`;
      return await client.get("/Item", params);
    }

    case "get_item": {
      const params: Record<string, string> = {};
      if (args.load_relations) params.load_relations = `["${args.load_relations.split(',').join('","')}"]`;
      return await client.get(`/Item/${args.item_id}`, params);
    }

    case "update_inventory": {
      const data: any = { qoh: args.qoh };
      if (args.reorderPoint !== undefined) data.reorderPoint = args.reorderPoint;
      if (args.reorderLevel !== undefined) data.reorderLevel = args.reorderLevel;
      return await client.put(`/ItemShop/${args.item_shop_id}`, data);
    }

    case "list_customers": {
      const params: Record<string, string> = {};
      if (args.limit) params.limit = String(args.limit);
      if (args.offset) params.offset = String(args.offset);
      if (args.firstName) params.firstName = args.firstName;
      if (args.lastName) params.lastName = args.lastName;
      if (args.email) params['Contact.email'] = args.email;
      if (args.phone) params['Contact.phone'] = args.phone;
      if (args.customerTypeID) params.customerTypeID = args.customerTypeID;
      if (args.load_relations) params.load_relations = `["${args.load_relations.split(',').join('","')}"]`;
      return await client.get("/Customer", params);
    }

    case "list_categories": {
      const params: Record<string, string> = {};
      if (args.limit) params.limit = String(args.limit);
      if (args.offset) params.offset = String(args.offset);
      if (args.parentID) params.parentID = args.parentID;
      if (args.name) params.name = args.name;
      if (args.load_relations) params.load_relations = `["${args.load_relations.split(',').join('","')}"]`;
      return await client.get("/Category", params);
    }

    case "get_register": {
      const params: Record<string, string> = {};
      if (args.shopID) params.shopID = args.shopID;
      if (args.load_relations) params.load_relations = `["${args.load_relations.split(',').join('","')}"]`;
      if (args.register_id) {
        return await client.get(`/Register/${args.register_id}`, params);
      }
      return await client.get("/Register", params);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ============================================
// SERVER SETUP
// ============================================
async function main() {
  const accessToken = process.env.LIGHTSPEED_ACCESS_TOKEN;
  const accountId = process.env.LIGHTSPEED_ACCOUNT_ID;

  if (!accessToken) {
    console.error("Error: LIGHTSPEED_ACCESS_TOKEN environment variable required");
    process.exit(1);
  }
  if (!accountId) {
    console.error("Error: LIGHTSPEED_ACCOUNT_ID environment variable required");
    process.exit(1);
  }

  const client = new LightspeedClient(accessToken, accountId);

  const server = new Server(
    { name: `${MCP_NAME}-mcp`, version: MCP_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleTool(client, name, args || {});
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${MCP_NAME} MCP server running on stdio`);
}

main().catch(console.error);
