# Lightspeed MCP Server

Complete Model Context Protocol (MCP) server for Lightspeed Retail and Restaurant POS platforms.

## 🚀 Features

### 77 Powerful Tools Across All Domains

#### Products & Inventory (17 tools)
- Full CRUD operations for products/items
- Advanced product search and filtering
- Bulk update operations
- Inventory tracking and adjustments
- Multi-location inventory management
- Stock level monitoring and alerts
- Product variants and matrix management
- Category management with hierarchy

#### Sales & Transactions (8 tools)
- Create and manage sales/transactions
- Process payments (cash, card, check)
- Sale completion and voiding
- Refund processing
- Daily sales summaries
- Sales by customer, employee, register

#### Orders & Purchasing (6 tools)
- Purchase order creation and management
- Order receiving and fulfillment
- Vendor ordering workflow
- Order shipment tracking

#### Customers (8 tools)
- Customer database management
- Advanced customer search
- Credit account management
- Store credit operations
- Customer analytics

#### Inventory Management (8 tools)
- Inventory counts and audits
- Inter-location transfers
- Inventory adjustment logs
- Stock transfer workflow
- Receiving and shipping

#### Vendors & Suppliers (5 tools)
- Vendor management
- Contact information
- Ordering preferences

#### Employees & Staff (6 tools)
- Employee management
- Time tracking
- Role management
- Performance tracking

#### Reports & Analytics (5 tools)
- Sales reports by period
- Inventory valuation reports
- Customer analytics
- Employee performance reports
- Top-selling products analysis

#### Additional Features (14 tools)
- Register/POS terminal management
- Workorder/service management
- Discount and promotion management
- Manufacturer/brand management
- Shop/location management
- Tax category management

### 17 React MCP Apps (Dark Theme)

1. **Dashboard** - Real-time business overview
2. **Product Manager** - Comprehensive product management
3. **Inventory Manager** - Stock tracking and transfers
4. **Sales Terminal** - Quick POS interface
5. **Customer Manager** - Customer database
6. **Order Manager** - Purchase orders
7. **Employee Manager** - Staff management
8. **Reports Viewer** - Business analytics
9. **Category Manager** - Product categories
10. **Vendor Manager** - Supplier management
11. **Workorder Manager** - Service tickets
12. **Register Manager** - POS control
13. **Transfer Manager** - Stock transfers
14. **Discount Manager** - Promotions
15. **Analytics Dashboard** - Business intelligence
16. **Quick Sale** - Fast checkout
17. **Low Stock Alerts** - Inventory alerts

## 📦 Installation

```bash
npm install @busybee3333/lightspeed-mcp-server
```

Or clone and build:

```bash
git clone https://github.com/BusyBee3333/mcpengine.git
cd mcpengine/servers/lightspeed
npm install
npm run build
```

## 🔐 Authentication

Lightspeed uses OAuth2 authentication. You'll need:

1. **Account ID** - Your Lightspeed account number
2. **Client ID** - OAuth client identifier
3. **Client Secret** - OAuth client secret
4. **Access Token** - (after OAuth flow)
5. **Refresh Token** - (after OAuth flow)

### Getting Credentials

#### Lightspeed Retail (R-Series)
1. Visit [Lightspeed Developer Portal](https://cloud.lightspeedapp.com/developers)
2. Create a new API application
3. Note your Client ID and Client Secret

#### Lightspeed Restaurant (K-Series)
1. Contact your Lightspeed Account Manager
2. Request API credentials
3. Choose trial or production environment

### OAuth Flow Example

```typescript
import { LightspeedClient } from '@busybee3333/lightspeed-mcp-server';

const client = new LightspeedClient({
  accountId: 'YOUR_ACCOUNT_ID',
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  apiType: 'retail', // or 'restaurant'
  environment: 'production', // or 'trial'
});

// 1. Get authorization URL
const authUrl = await client.getAuthorizationUrl(
  'https://your-redirect-uri.com/callback',
  'employee:all', // scope
  'random-state-string'
);

// 2. User visits authUrl and authorizes
// 3. Exchange code for tokens
const tokens = await client.exchangeCodeForToken(
  authorizationCode,
  'https://your-redirect-uri.com/callback'
);

console.log(tokens.access_token);
console.log(tokens.refresh_token);
```

## 🚀 Usage

### MCP Server

Set environment variables:

```bash
export LIGHTSPEED_ACCOUNT_ID="123456"
export LIGHTSPEED_CLIENT_ID="your-client-id"
export LIGHTSPEED_CLIENT_SECRET="your-client-secret"
export LIGHTSPEED_ACCESS_TOKEN="your-access-token"
export LIGHTSPEED_REFRESH_TOKEN="your-refresh-token"
export LIGHTSPEED_API_TYPE="retail"  # or "restaurant"
export LIGHTSPEED_ENVIRONMENT="production"  # or "trial"
```

Run the server:

```bash
npx lightspeed-mcp
```

### Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lightspeed": {
      "command": "npx",
      "args": ["-y", "@busybee3333/lightspeed-mcp-server"],
      "env": {
        "LIGHTSPEED_ACCOUNT_ID": "123456",
        "LIGHTSPEED_CLIENT_ID": "your-client-id",
        "LIGHTSPEED_CLIENT_SECRET": "your-secret",
        "LIGHTSPEED_ACCESS_TOKEN": "your-token",
        "LIGHTSPEED_REFRESH_TOKEN": "your-refresh",
        "LIGHTSPEED_API_TYPE": "retail",
        "LIGHTSPEED_ENVIRONMENT": "production"
      }
    }
  }
}
```

### Programmatic Usage

```typescript
import { LightspeedMCPServer } from '@busybee3333/lightspeed-mcp-server';

const server = new LightspeedMCPServer(
  'account-id',
  'client-id',
  'client-secret',
  {
    accessToken: 'your-token',
    refreshToken: 'your-refresh-token',
    apiType: 'retail',
    environment: 'production',
  }
);

await server.run();
```

## 🛠️ Available Tools

### Product Tools

- `lightspeed_list_products` - List all products with filters
- `lightspeed_get_product` - Get product details
- `lightspeed_create_product` - Create new product
- `lightspeed_update_product` - Update product
- `lightspeed_delete_product` - Archive product
- `lightspeed_search_products` - Advanced search
- `lightspeed_bulk_update_products` - Bulk operations
- `lightspeed_get_product_inventory` - Inventory levels
- `lightspeed_adjust_product_inventory` - Adjust stock

### Sales Tools

- `lightspeed_list_sales` - List transactions
- `lightspeed_get_sale` - Get sale details
- `lightspeed_create_sale` - Create new sale
- `lightspeed_complete_sale` - Finalize transaction
- `lightspeed_void_sale` - Void transaction
- `lightspeed_add_sale_payment` - Add payment
- `lightspeed_get_daily_sales` - Daily summary
- `lightspeed_refund_sale` - Process refund

### Customer Tools

- `lightspeed_list_customers` - List all customers
- `lightspeed_get_customer` - Customer details
- `lightspeed_create_customer` - New customer
- `lightspeed_update_customer` - Update customer
- `lightspeed_delete_customer` - Archive customer
- `lightspeed_search_customers` - Search customers
- `lightspeed_get_customer_credit_account` - Store credit
- `lightspeed_add_customer_credit` - Add credit

### Report Tools

- `lightspeed_sales_report` - Sales analytics
- `lightspeed_inventory_report` - Stock valuation
- `lightspeed_customer_report` - Customer analytics
- `lightspeed_employee_performance_report` - Staff metrics
- `lightspeed_product_performance_report` - Top sellers

...and 50+ more tools!

## 🌐 React Apps

All apps are built with Vite and feature a modern dark theme. Access them at:

```
dist/ui/dashboard/index.html
dist/ui/product-manager/index.html
dist/ui/sales-terminal/index.html
...etc
```

## 🏗️ Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Development mode (watch)
npm run dev

# Build React apps
node build-apps.js
```

## 📚 API Documentation

### Lightspeed Retail (R-Series)
- [API Documentation](https://developers.lightspeedhq.com/retail/)
- Base URL: `https://api.lightspeedapp.com/API/V3`
- Auth: OAuth2

### Lightspeed Restaurant (K-Series)
- [API Documentation](https://api-docs.lsk.lightspeed.app/)
- Base URL: `https://api.lsk.lightspeed.app`
- Auth: OAuth2 with Basic authentication

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- GitHub Issues: [BusyBee3333/mcpengine](https://github.com/BusyBee3333/mcpengine/issues)
- Documentation: [MCP Engine Docs](https://github.com/BusyBee3333/mcpengine)

## 🎯 Roadmap

- [ ] Webhook support for real-time updates
- [ ] Advanced reporting dashboards
- [ ] Multi-currency support
- [ ] E-commerce integration tools
- [ ] Custom field management
- [ ] Advanced pricing rules
- [ ] Loyalty program integration

---

**Built with ❤️ by BusyBee3333**

Part of the [MCP Engine](https://github.com/BusyBee3333/mcpengine) project - Complete MCP servers for 40+ platforms.
