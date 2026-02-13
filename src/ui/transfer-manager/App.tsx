import { useState } from 'react';
import './app.css';

export default function TransferManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>🚚 Transfer Manager</h1>
        <p>Inter-location transfers</p>
      </header>
      <div className="content">
        <p>MCP-powered Transfer Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
