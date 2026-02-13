import { useState } from 'react';
import './app.css';

export default function SalesTerminal() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>💳 Sales Terminal</h1>
        <p>Quick POS sales interface</p>
      </header>
      <div className="content">
        <p>MCP-powered Sales Terminal - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
