import { useState } from 'react';
import './app.css';

export default function CustomerManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>👥 Customer Manager</h1>
        <p>Customer database and analytics</p>
      </header>
      <div className="content">
        <p>MCP-powered Customer Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
