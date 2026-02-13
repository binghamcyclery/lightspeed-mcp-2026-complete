import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const apps = [
  { name: 'product-manager', title: 'Product Manager', icon: '📦', desc: 'Manage inventory and products' },
  { name: 'inventory-manager', title: 'Inventory Manager', icon: '📊', desc: 'Track stock levels and transfers' },
  { name: 'sales-terminal', title: 'Sales Terminal', icon: '💳', desc: 'Quick POS sales interface' },
  { name: 'customer-manager', title: 'Customer Manager', icon: '👥', desc: 'Customer database and analytics' },
  { name: 'order-manager', title: 'Order Manager', icon: '📋', desc: 'Purchase orders and receiving' },
  { name: 'employee-manager', title: 'Employee Manager', icon: '👤', desc: 'Staff management and time tracking' },
  { name: 'reports', title: 'Reports Viewer', icon: '📈', desc: 'Sales and performance reports' },
  { name: 'category-manager', title: 'Category Manager', icon: '🗂️', desc: 'Product category hierarchy' },
  { name: 'vendor-manager', title: 'Vendor Manager', icon: '🏢', desc: 'Supplier management' },
  { name: 'workorder-manager', title: 'Workorder Manager', icon: '🔧', desc: 'Service workorders' },
  { name: 'register-manager', title: 'Register Manager', icon: '💰', desc: 'POS register control' },
  { name: 'transfer-manager', title: 'Transfer Manager', icon: '🚚', desc: 'Inter-location transfers' },
  { name: 'discount-manager', title: 'Discount Manager', icon: '🎟️', desc: 'Promotions and discounts' },
  { name: 'analytics', title: 'Analytics Dashboard', icon: '📊', desc: 'Business intelligence' },
  { name: 'quick-sale', title: 'Quick Sale', icon: '⚡', desc: 'Fast checkout interface' },
  { name: 'low-stock-alert', title: 'Low Stock Alerts', icon: '⚠️', desc: 'Inventory alerts' },
];

const cssTemplate = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f0f0f;
  color: #e0e0e0;
  min-height: 100vh;
}

.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  margin-bottom: 2rem;
  text-align: center;
}

header h1 {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

header p {
  color: #888;
  font-size: 1.1rem;
}

.content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #2a2a3e;
  border-radius: 12px;
  padding: 2rem;
  min-height: 400px;
}

.btn {
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #2a2a3e;
}

th {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  font-weight: 600;
}

input, select {
  width: 100%;
  padding: 0.8rem;
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 1rem;
  margin-bottom: 1rem;
}

input:focus, select:focus {
  outline: none;
  border-color: #667eea;
}
`;

apps.forEach(app => {
  const dir = join(process.cwd(), 'src/ui', app.name);
  
  try {
    mkdirSync(dir, { recursive: true });
  } catch {}
  
  const appTsx = `import { useState } from 'react';
import './app.css';

export default function ${app.title.replace(/\s+/g, '')}() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>${app.icon} ${app.title}</h1>
        <p>${app.desc}</p>
      </header>
      <div className="content">
        <p>MCP-powered ${app.title} - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
`;

  const mainTsx = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${app.title}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/main.tsx"></script>
</body>
</html>
`;

  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
});
`;

  writeFileSync(join(dir, 'App.tsx'), appTsx);
  writeFileSync(join(dir, 'app.css'), cssTemplate);
  writeFileSync(join(dir, 'main.tsx'), mainTsx);
  writeFileSync(join(dir, 'index.html'), html);
  writeFileSync(join(dir, 'vite.config.ts'), viteConfig);
  
  console.log(`✓ Created ${app.name}`);
});

console.log(`\n✓ Created ${apps.length} React apps successfully!`);
