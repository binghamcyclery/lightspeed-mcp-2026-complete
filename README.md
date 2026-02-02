> **🚀 Don't want to self-host?** [Join the waitlist for our fully managed solution →](https://mcpengage.com/lightspeed)
> 
> Zero setup. Zero maintenance. Just connect and automate.

---

# 🚀 Lightspeed MCP Server — 2026 Complete Version

## 💡 What This Unlocks

**This MCP server gives AI direct access to your Lightspeed Retail POS system.** Instead of manually managing sales, inventory, and customer data through the POS interface, you just *tell* the AI what you need — in plain English.

### 🎯 Retail POS Power Moves

The AI can directly control your Lightspeed Retail system with natural language:

1. **Sales Analytics** — "Show me all sales from the last 24 hours broken down by employee and location"
2. **Inventory Tracking** — "List all items with stock below reorder point and generate a purchase order list"
3. **Product Management** — "Find all items in the 'Electronics' category and show their current stock levels"
4. **Customer Intelligence** — "Get all customers who made purchases over $500 in the last month"
5. **Register Operations** — "Show me register status for all locations and today's cash counts"

### 🔗 The Real Power: Combining Tools

AI can chain multiple Lightspeed operations together in one conversation:

- Query sales data → Filter by employee → Generate performance report
- Check inventory levels → Identify low stock → Create reorder workflow
- Pull customer data → Match with purchase history → Generate loyalty insights
- Analyze category performance → Adjust pricing → Update inventory levels

## 📦 What's Inside

**8 powerful API tools** covering Lightspeed Retail POS operations:
- `list_sales` — Browse completed transactions with filters
- `get_sale` — Get complete sale details with line items and payments
- `list_items` — Query inventory catalog with advanced filters
- `get_item` — Get full item details including pricing and stock
- `update_inventory` — Adjust stock levels for items at specific locations
- `list_customers` — Browse customer database
- `list_categories` — View product category hierarchy
- `get_register` — Get POS terminal information and status

All with proper error handling, automatic authentication, and TypeScript types.

## 🚀 Quick Start

### Option 1: Claude Desktop (Local)

1. **Clone and build:**
   ```bash
   git clone https://github.com/BusyBee3333/Lightspeed-MCP-2026-Complete.git
   cd lightspeed-mcp-2026-complete
   npm install
   npm run build
   ```

2. **Get your Lightspeed API credentials:**
   - Log in to Lightspeed Back Office
   - Go to **Account Settings → API Settings → Generate Token**
   - Complete OAuth authorization flow
   - Copy your **Access Token** and **Account ID**

3. **Configure Claude Desktop:**
   
   On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   On Windows: `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "lightspeed": {
         "command": "node",
         "args": ["/ABSOLUTE/PATH/TO/lightspeed-mcp-2026-complete/dist/index.js"],
         "env": {
           "LIGHTSPEED_ACCESS_TOKEN": "your-access-token-here",
           "LIGHTSPEED_ACCOUNT_ID": "your-account-id"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**

### Option 2: Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/lightspeed-mcp)

1. Click the button above
2. Set your Lightspeed API credentials in Railway dashboard
3. Use the Railway URL as your MCP server endpoint

### Option 3: Docker

```bash
docker build -t lightspeed-mcp .
docker run -p 3000:3000 \
  -e LIGHTSPEED_ACCESS_TOKEN=your-token \
  -e LIGHTSPEED_ACCOUNT_ID=your-account-id \
  lightspeed-mcp
```

## 🔐 Authentication

**Lightspeed uses OAuth2 authentication with Access Tokens and Account IDs.**

**Setup Steps:**
1. In Lightspeed Back Office: **Account Settings → API Settings**
2. Click **Generate Token** or create an OAuth application
3. Complete the OAuth authorization flow
4. Save these credentials:
   - **Access Token** — Your OAuth bearer token
   - **Account ID** — Your Lightspeed account identifier (found in URL: `/Account/{ID}/`)

**API Documentation:** https://developers.lightspeedhq.com/retail/introduction/authentication

**Token Management:**
- Access tokens expire after 1 hour
- Use refresh tokens to obtain new access tokens
- This MCP server requires a valid access token

The MCP server handles all API requests automatically using your credentials.

## 🎯 Example Prompts

Once connected to Claude, you can use natural language for retail POS operations:

**Sales Tracking:**
- *"Show me all completed sales from today"*
- *"Get sales for employee ID 5 from the last week"*
- *"List sales over $100 from location 'Downtown Store'"*

**Inventory Management:**
- *"Show me all items with quantity on hand below 10"*
- *"Update inventory for item shop ID 12345 to 50 units"*
- *"List all items in category 'Apparel' with their stock levels"*

**Product Catalog:**
- *"Get all items with UPC barcode '012345678901'"*
- *"Show me items from manufacturer 'Apple' with inventory details"*
- *"List all items that need reordering based on reorder point"*

**Customer Management:**
- *"Find all customers with last name 'Smith'"*
- *"Get customers who joined in the last 30 days"*
- *"List customers with email containing '@gmail.com'"*

**Register Operations:**
- *"Show me all register terminals at location 'Main St Store'"*
- *"Get register status and cash count for register ID 3"*
- *"List all active registers across all locations"*

**Analytics & Reporting:**
- *"Generate a sales report for the last 7 days grouped by category"*
- *"Show me top-selling items from this month"*
- *"Export all customer purchase data from Q4 2024"*

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Lightspeed Retail account with API access
- Valid OAuth access token and account ID

### Setup

```bash
git clone https://github.com/BusyBee3333/Lightspeed-MCP-2026-Complete.git
cd lightspeed-mcp-2026-complete
npm install
cp .env.example .env
# Edit .env with your Lightspeed credentials
npm run build
npm start
```

### Testing

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

## 🐛 Troubleshooting

### "Authentication failed"
- Verify your **Access Token** is current (tokens expire after 1 hour)
- Check that your **Account ID** matches your Lightspeed account
- Regenerate your access token if needed

### "Tools not appearing in Claude"
- Restart Claude Desktop after updating config
- Check that the path in `claude_desktop_config.json` is **absolute** (not relative)
- Verify the build completed successfully (`dist/index.js` exists)

### "401 Unauthorized" errors
- Your access token has likely expired (1-hour lifetime)
- Use your refresh token to obtain a new access token
- Update your `.env` or Claude config with the new token

### "Rate limit exceeded"
- Lightspeed has rate limits: 10 requests/second (burst), 600 requests/minute
- The server respects rate limits automatically
- Space out large batch operations

## 📖 Resources

- [Lightspeed Retail API Documentation](https://developers.lightspeedhq.com/retail/)
- [Lightspeed API Reference](https://developers.lightspeedhq.com/retail/endpoints/)
- [OAuth Authentication Guide](https://developers.lightspeedhq.com/retail/introduction/authentication/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Claude Desktop Documentation](https://claude.ai/desktop)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-tool`)
3. Commit your changes (`git commit -m 'Add amazing tool'`)
4. Push to the branch (`git push origin feature/amazing-tool`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Credits

Built by [MCPEngage](https://mcpengage.com) — AI infrastructure for business software.

Want more MCP servers? Check out our [full catalog](https://mcpengage.com) covering 30+ business platforms.

---

**Questions?** Open an issue or join our [Discord community](https://discord.gg/mcpengine).
