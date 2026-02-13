import { useState } from 'react';
import './app.css';

export default function VendorManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>🏢 Vendor Manager</h1>
        <p>Supplier management</p>
      </header>
      <div className="content">
        <p>MCP-powered Vendor Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
