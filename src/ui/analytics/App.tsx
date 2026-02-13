import { useState } from 'react';
import './app.css';

export default function AnalyticsDashboard() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>📊 Analytics Dashboard</h1>
        <p>Business intelligence</p>
      </header>
      <div className="content">
        <p>MCP-powered Analytics Dashboard - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
