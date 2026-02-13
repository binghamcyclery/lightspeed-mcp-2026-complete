import { useState } from 'react';
import './app.css';

export default function ProductManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>📦 Product Manager</h1>
        <p>Manage inventory and products</p>
      </header>
      <div className="content">
        <p>MCP-powered Product Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
