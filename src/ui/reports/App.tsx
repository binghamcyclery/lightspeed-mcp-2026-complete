import { useState } from 'react';
import './app.css';

export default function ReportsViewer() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>📈 Reports Viewer</h1>
        <p>Sales and performance reports</p>
      </header>
      <div className="content">
        <p>MCP-powered Reports Viewer - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
