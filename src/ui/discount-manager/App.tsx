import { useState } from 'react';
import './app.css';

export default function DiscountManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>🎟️ Discount Manager</h1>
        <p>Promotions and discounts</p>
      </header>
      <div className="content">
        <p>MCP-powered Discount Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
