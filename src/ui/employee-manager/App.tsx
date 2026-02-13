import { useState } from 'react';
import './app.css';

export default function EmployeeManager() {
  const [data, setData] = useState([]);

  return (
    <div className="app">
      <header>
        <h1>👤 Employee Manager</h1>
        <p>Staff management and time tracking</p>
      </header>
      <div className="content">
        <p>MCP-powered Employee Manager - Coming soon!</p>
        <button className="btn">Load Data</button>
      </div>
    </div>
  );
}
