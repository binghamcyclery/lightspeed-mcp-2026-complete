import React, { useState } from 'react';

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  maxStock: number;
  lastRestocked: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';
}

export default function InventoryTracker() {
  const [items] = useState<InventoryItem[]>([
    { id: '1', productName: 'Premium Coffee Beans', sku: 'COF001', category: 'Coffee', currentStock: 45, reorderPoint: 20, maxStock: 100, lastRestocked: '2024-02-10', status: 'in-stock' },
    { id: '2', productName: 'Espresso Machine', sku: 'MAC001', category: 'Equipment', currentStock: 3, reorderPoint: 5, maxStock: 15, lastRestocked: '2024-01-15', status: 'low-stock' },
    { id: '3', productName: 'Ceramic Mug', sku: 'MUG001', category: 'Accessories', currentStock: 0, reorderPoint: 25, maxStock: 150, lastRestocked: '2024-01-20', status: 'out-of-stock' },
    { id: '4', productName: 'Tea Assortment', sku: 'TEA001', category: 'Tea', currentStock: 8, reorderPoint: 10, maxStock: 50, lastRestocked: '2024-02-08', status: 'low-stock' },
    { id: '5', productName: 'Milk Frother', sku: 'ACC001', category: 'Accessories', currentStock: 12, reorderPoint: 8, maxStock: 30, lastRestocked: '2024-02-11', status: 'in-stock' },
    { id: '6', productName: 'Coffee Filters', sku: 'ACC002', category: 'Accessories', currentStock: 156, reorderPoint: 50, maxStock: 100, lastRestocked: '2024-02-12', status: 'overstock' },
    { id: '7', productName: 'Cold Brew Maker', sku: 'EQP002', category: 'Equipment', currentStock: 15, reorderPoint: 5, maxStock: 20, lastRestocked: '2024-02-09', status: 'in-stock' },
    { id: '8', productName: 'Green Tea', sku: 'TEA002', category: 'Tea', currentStock: 22, reorderPoint: 15, maxStock: 60, lastRestocked: '2024-02-13', status: 'in-stock' },
  ]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalItems: items.length,
    lowStock: items.filter(i => i.status === 'low-stock').length,
    outOfStock: items.filter(i => i.status === 'out-of-stock').length,
    overstock: items.filter(i => i.status === 'overstock').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-500/20 text-green-400';
      case 'low-stock': return 'bg-yellow-500/20 text-yellow-400';
      case 'out-of-stock': return 'bg-red-500/20 text-red-400';
      case 'overstock': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-600/50 text-slate-400';
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Inventory Tracker</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Items" value={stats.totalItems} icon="📦" color="text-blue-400" />
          <StatCard title="Low Stock" value={stats.lowStock} icon="⚠️" color="text-yellow-400" />
          <StatCard title="Out of Stock" value={stats.outOfStock} icon="❌" color="text-red-400" />
          <StatCard title="Overstock" value={stats.overstock} icon="📈" color="text-blue-400" />
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status Filter</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="overstock">Overstock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">SKU</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Category</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Stock Level</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Reorder Point</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Last Restocked</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="py-4 px-4 font-medium">{item.productName}</td>
                    <td className="py-4 px-4 text-slate-400">{item.sku}</td>
                    <td className="py-4 px-4 text-slate-400">{item.category}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center">
                        <div className="font-semibold mb-1">{item.currentStock} / {item.maxStock}</div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.status === 'out-of-stock' ? 'bg-red-500' :
                              item.status === 'low-stock' ? 'bg-yellow-500' :
                              item.status === 'overstock' ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-400">{item.reorderPoint}</td>
                    <td className="py-4 px-4 text-slate-400">{new Date(item.lastRestocked).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center gap-2">
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                          Restock
                        </button>
                        <button className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm">
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No items found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
