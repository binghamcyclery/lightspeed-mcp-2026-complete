import React, { useState } from 'react';

interface ProductPerformance {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  averagePrice: number;
  stockTurnover: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export default function ProductPerformance() {
  const [products] = useState<ProductPerformance[]>([
    { id: '1', name: 'Premium Coffee Beans', sku: 'COF001', category: 'Coffee', unitsSold: 487, revenue: 12168.13, profit: 6084.07, averagePrice: 24.99, stockTurnover: 9.7, trend: 'up', trendPercentage: 15.3 },
    { id: '2', name: 'Espresso Machine', sku: 'MAC001', category: 'Equipment', unitsSold: 12, revenue: 10799.88, profit: 4319.95, averagePrice: 899.99, stockTurnover: 4.0, trend: 'up', trendPercentage: 8.5 },
    { id: '3', name: 'Ceramic Mug', sku: 'MUG001', category: 'Accessories', unitsSold: 234, revenue: 3039.66, profit: 1519.83, averagePrice: 12.99, stockTurnover: 9.4, trend: 'stable', trendPercentage: 1.2 },
    { id: '4', name: 'Tea Assortment', sku: 'TEA001', category: 'Tea', unitsSold: 156, revenue: 3118.44, profit: 1559.22, averagePrice: 19.99, stockTurnover: 13.0, trend: 'up', trendPercentage: 22.7 },
    { id: '5', name: 'Milk Frother', sku: 'ACC001', category: 'Accessories', unitsSold: 89, revenue: 4449.11, profit: 2224.56, averagePrice: 49.99, stockTurnover: 7.4, trend: 'down', trendPercentage: -5.8 },
    { id: '6', name: 'Cold Brew Maker', sku: 'EQP002', category: 'Equipment', unitsSold: 45, revenue: 3599.55, profit: 1799.78, averagePrice: 79.99, stockTurnover: 3.0, trend: 'stable', trendPercentage: 0.5 },
    { id: '7', name: 'Green Tea', sku: 'TEA002', category: 'Tea', unitsSold: 178, revenue: 2668.22, profit: 1334.11, averagePrice: 14.99, stockTurnover: 8.1, trend: 'up', trendPercentage: 12.4 },
    { id: '8', name: 'Coffee Filters', sku: 'ACC002', category: 'Accessories', unitsSold: 567, revenue: 3963.33, profit: 1981.67, averagePrice: 6.99, stockTurnover: 5.7, trend: 'down', trendPercentage: -3.2 },
  ]);

  const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'profit' | 'turnover'>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState('all');

  const sortedProducts = [...products]
    .filter(p => filterCategory === 'all' || p.category === filterCategory)
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'revenue': return (b.revenue - a.revenue) * multiplier;
        case 'units': return (b.unitsSold - a.unitsSold) * multiplier;
        case 'profit': return (b.profit - a.profit) * multiplier;
        case 'turnover': return (b.stockTurnover - a.stockTurnover) * multiplier;
        default: return 0;
      }
    });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalProfit = products.reduce((sum, p) => sum + p.profit, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.unitsSold, 0);
  const avgTurnover = products.reduce((sum, p) => sum + p.stockTurnover, 0) / products.length;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      case 'stable': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Product Performance Analytics</h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon="💰" />
          <StatCard title="Total Profit" value={`$${totalProfit.toFixed(2)}`} icon="📊" />
          <StatCard title="Units Sold" value={totalUnits} icon="📦" />
          <StatCard title="Avg Turnover" value={`${avgTurnover.toFixed(1)}×`} icon="🔄" />
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
              >
                <option value="revenue">Revenue</option>
                <option value="units">Units Sold</option>
                <option value="profit">Profit</option>
                <option value="turnover">Stock Turnover</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Direction</label>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Performance Table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Category</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Units Sold</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Revenue</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Profit</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Avg Price</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Turnover</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product, index) => (
                  <tr key={product.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="py-4 px-4">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-slate-400">{product.sku}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{product.category}</td>
                    <td className="py-4 px-4 text-right font-semibold">{product.unitsSold}</td>
                    <td className="py-4 px-4 text-right font-semibold text-green-400">${product.revenue.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right font-semibold text-blue-400">${product.profit.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right text-slate-300">${product.averagePrice.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-semibold ${
                        product.stockTurnover >= 8 ? 'text-green-400' :
                        product.stockTurnover >= 5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {product.stockTurnover.toFixed(1)}×
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl">{getTrendIcon(product.trend)}</span>
                        <span className={`text-sm font-semibold ${getTrendColor(product.trend)}`}>
                          {product.trendPercentage > 0 ? '+' : ''}{product.trendPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⭐</span>
              <h3 className="font-bold text-green-400">Top Performer</h3>
            </div>
            <p className="text-sm text-slate-300">
              {sortedProducts[0]?.name} leads with ${sortedProducts[0]?.revenue.toFixed(2)} in revenue
            </p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔄</span>
              <h3 className="font-bold text-yellow-400">Fast Mover</h3>
            </div>
            <p className="text-sm text-slate-300">
              {[...products].sort((a, b) => b.stockTurnover - a.stockTurnover)[0]?.name} has the highest turnover rate
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💎</span>
              <h3 className="font-bold text-blue-400">Most Profitable</h3>
            </div>
            <p className="text-sm text-slate-300">
              {[...products].sort((a, b) => b.profit - a.profit)[0]?.name} generates highest profit margin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
