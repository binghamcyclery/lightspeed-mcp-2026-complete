import { useState } from 'react';
import './app.css';

export default function QuickSale() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>⚡ Quick Sale</h1>
        <p>Fast checkout interface</p>
      </header>
      <div className="content">
        <p>MCP-powered Quick Sale - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
