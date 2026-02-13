import { useState } from 'react';
import './app.css';

export default function InventoryManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>📊 Inventory Manager</h1>
        <p>Track stock levels and transfers</p>
      </header>
      <div className="content">
        <p>MCP-powered Inventory Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
