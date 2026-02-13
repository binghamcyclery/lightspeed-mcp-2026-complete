import { useState } from 'react';
import './app.css';

export default function OrderManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>📋 Order Manager</h1>
        <p>Purchase orders and receiving</p>
      </header>
      <div className="content">
        <p>MCP-powered Order Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
