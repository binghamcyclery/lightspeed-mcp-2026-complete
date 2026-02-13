import { useState } from 'react';
import './app.css';

export default function RegisterManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>💰 Register Manager</h1>
        <p>POS register control</p>
      </header>
      <div className="content">
        <p>MCP-powered Register Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
