import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'inactive';
}

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export default function ProductDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading products
    const mockProducts: Product[] = [
      { id: '1', name: 'Premium Coffee Beans', sku: 'COF001', price: 24.99, stock: 45, category: 'Coffee', status: 'active' },
      { id: '2', name: 'Espresso Machine', sku: 'MAC001', price: 899.99, stock: 3, category: 'Equipment', status: 'active' },
      { id: '3', name: 'Ceramic Mug', sku: 'MUG001', price: 12.99, stock: 0, category: 'Accessories', status: 'active' },
      { id: '4', name: 'Tea Assortment', sku: 'TEA001', price: 19.99, stock: 8, category: 'Tea', status: 'active' },
      { id: '5', name: 'Milk Frother', sku: 'ACC001', price: 49.99, stock: 12, category: 'Accessories', status: 'inactive' },
    ];

    const totalValue = mockProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStock = mockProducts.filter(p => p.stock > 0 && p.stock < 10).length;
    const outOfStock = mockProducts.filter(p => p.stock === 0).length;

    setStats({
      totalProducts: mockProducts.length,
      activeProducts: mockProducts.filter(p => p.status === 'active').length,
      lowStock,
      outOfStock,
      totalValue
    });
    setTopProducts(mockProducts.slice(0, 5));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Product Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon="📦"
            color="bg-blue-500/10 text-blue-400"
          />
          <StatCard
            title="Active Products"
            value={stats.activeProducts}
            icon="✅"
            color="bg-green-500/10 text-green-400"
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStock}
            icon="⚠️"
            color="bg-yellow-500/10 text-yellow-400"
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStock}
            icon="❌"
            color="bg-red-500/10 text-red-400"
          />
          <StatCard
            title="Total Value"
            value={`$${stats.totalValue.toFixed(2)}`}
            icon="💰"
            color="bg-purple-500/10 text-purple-400"
          />
        </div>

        {/* Top Products Table */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">SKU</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Category</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Price</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Stock</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-slate-400">{product.sku}</td>
                    <td className="py-3 px-4 text-slate-400">{product.category}</td>
                    <td className="py-3 px-4 text-right">${product.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={
                        product.stock === 0 ? 'text-red-400' :
                        product.stock < 10 ? 'text-yellow-400' : 'text-slate-300'
                      }>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</div>
    </div>
  );
}
