import { useState } from 'react';
import './app.css';

export default function LowStockAlerts() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>⚠️ Low Stock Alerts</h1>
        <p>Inventory alerts</p>
      </header>
      <div className="content">
        <p>MCP-powered Low Stock Alerts - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
