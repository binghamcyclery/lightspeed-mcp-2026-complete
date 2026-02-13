import { useState } from 'react';
import './app.css';

export default function CategoryManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>🗂️ Category Manager</h1>
        <p>Product category hierarchy</p>
      </header>
      <div className="content">
        <p>MCP-powered Category Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
