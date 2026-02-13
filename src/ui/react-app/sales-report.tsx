import React, { useState } from 'react';

interface SalesData {
  date: string;
  sales: number;
  transactions: number;
  averageValue: number;
}

export default function SalesReport() {
  const [dateRange, setDateRange] = useState('week');
  const [reportType, setReportType] = useState('overview');

  const [dailySales] = useState<SalesData[]>([
    { date: '2024-02-07', sales: 1847.25, transactions: 42, averageValue: 43.98 },
    { date: '2024-02-08', sales: 2156.80, transactions: 51, averageValue: 42.29 },
    { date: '2024-02-09', sales: 1923.45, transactions: 38, averageValue: 50.62 },
    { date: '2024-02-10', sales: 2487.90, transactions: 56, averageValue: 44.43 },
    { date: '2024-02-11', sales: 1678.50, transactions: 34, averageValue: 49.37 },
    { date: '2024-02-12', sales: 2934.60, transactions: 64, averageValue: 45.85 },
    { date: '2024-02-13', sales: 2247.35, transactions: 48, averageValue: 46.82 },
  ]);

  const [categoryBreakdown] = useState([
    { category: 'Coffee', sales: 5847.50, percentage: 38.5 },
    { category: 'Equipment', sales: 4234.80, percentage: 27.9 },
    { category: 'Accessories', sales: 2456.40, percentage: 16.2 },
    { category: 'Tea', sales: 1945.60, percentage: 12.8 },
    { category: 'Syrups', states: 692.55, percentage: 4.6 },
  ]);

  const [topProducts] = useState([
    { name: 'Premium Coffee Beans', sales: 2487.75, units: 124, revenue: 2487.75 },
    { name: 'Espresso Machine', sales: 1799.98, units: 2, revenue: 1799.98 },
    { name: 'Ceramic Mug Set', sales: 1247.88, units: 96, revenue: 1247.88 },
    { name: 'Cold Brew Maker', sales: 1119.86, units: 14, revenue: 1119.86 },
    { name: 'Tea Assortment', sales: 999.50, units: 50, revenue: 999.50 },
  ]);

  const totalSales = dailySales.reduce((sum, day) => sum + day.sales, 0);
  const totalTransactions = dailySales.reduce((sum, day) => sum + day.transactions, 0);
  const averageTransactionValue = totalSales / totalTransactions;
  const averageDailySales = totalSales / dailySales.length;

  const maxSales = Math.max(...dailySales.map(d => d.sales));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sales Report</h1>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-4">
            <label className="block text-sm text-slate-400 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <label className="block text-sm text-slate-400 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
            >
              <option value="overview">Overview</option>
              <option value="products">By Product</option>
              <option value="categories">By Category</option>
              <option value="employees">By Employee</option>
              <option value="payment">By Payment Method</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Sales" value={`$${totalSales.toFixed(2)}`} icon="💰" trend="+12.5%" />
          <StatCard title="Transactions" value={totalTransactions} icon="🧾" trend="+8.2%" />
          <StatCard title="Avg Transaction" value={`$${averageTransactionValue.toFixed(2)}`} icon="📊" trend="+3.7%" />
          <StatCard title="Avg Daily Sales" value={`$${averageDailySales.toFixed(2)}`} icon="📈" trend="+15.4%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Sales Chart */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Daily Sales Trend</h2>
            <div className="space-y-3">
              {dailySales.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-24">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-10 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full flex items-center justify-end pr-3"
                      style={{ width: `${(day.sales / maxSales) * 100}%` }}
                    >
                      <span className="text-white text-sm font-medium">${day.sales.toFixed(0)}</span>
                    </div>
                  </div>
                  <span className="text-sm text-slate-400 w-16 text-right">{day.transactions} txn</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Sales by Category</h2>
            <div className="space-y-4">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{cat.category}</span>
                    <div className="text-right">
                      <div className="font-bold text-green-400">${cat.sales.toFixed(2)}</div>
                      <div className="text-xs text-slate-400">{cat.percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Top Performing Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Rank</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Product</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Units Sold</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Revenue</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={product.name} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-slate-400/20 text-slate-300' :
                        index === 2 ? 'bg-amber-700/20 text-amber-500' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{product.units}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-400">${product.revenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-400">${(product.revenue / product.units).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Options */}
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
            📊 Export to Excel
          </button>
          <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium">
            📄 Export to PDF
          </button>
          <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium">
            📧 Email Report
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: string | number; icon: string; trend?: string }) {
  const isPositive = trend?.startsWith('+');
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {trend && (
        <div className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend} vs last period
        </div>
      )}
    </div>
  );
}
