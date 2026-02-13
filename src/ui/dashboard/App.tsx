import { useState, useEffect } from 'react';
import './app.css';

interface Stats {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated stats - in real app, fetch from MCP server
    setTimeout(() => {
      setStats({
        totalSales: 142,
        totalRevenue: 24567.89,
        totalCustomers: 328,
        totalProducts: 1456,
        lowStockCount: 23,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="app">
      <header>
        <h1>🚀 Lightspeed Dashboard</h1>
        <p>Real-time POS & inventory insights</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">${stats?.totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Today's Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalSales}</div>
          <div className="stat-label">Sales Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalCustomers}</div>
          <div className="stat-label">Total Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalProducts}</div>
          <div className="stat-label">Products</div>
        </div>
      </div>

      <div className="alerts">
        <div className="alert warning">
          <strong>⚠️ Low Stock Alert:</strong> {stats?.lowStockCount} items need reordering
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <button className="action-btn">➕ New Sale</button>
          <button className="action-btn">📦 Add Product</button>
          <button className="action-btn">👥 New Customer</button>
          <button className="action-btn">📊 View Reports</button>
        </div>
      </div>
    </div>
  );
}
