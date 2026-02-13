import { useState } from 'react';
import './app.css';

export default function WorkorderManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>🔧 Workorder Manager</h1>
        <p>Service workorders</p>
      </header>
      <div className="content">
        <p>MCP-powered Workorder Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
