import React, { useState } from 'react';

interface Discount {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'free-shipping';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageCount: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired' | 'disabled';
  applicableTo: 'all' | 'specific-products' | 'specific-categories';
}

export default function DiscountManager() {
  const [discounts] = useState<Discount[]>([
    { id: 'DSC-001', name: 'Welcome10', code: 'WELCOME10', type: 'percentage', value: 10, minPurchase: 50, usageCount: 124, usageLimit: 500, startDate: '2024-01-01', endDate: '2024-12-31', status: 'active', applicableTo: 'all' },
    { id: 'DSC-002', name: 'Spring Sale', code: 'SPRING25', type: 'percentage', value: 25, minPurchase: 100, maxDiscount: 50, usageCount: 87, startDate: '2024-03-01', endDate: '2024-05-31', status: 'scheduled', applicableTo: 'specific-categories' },
    { id: 'DSC-003', name: 'Free Shipping', code: 'FREESHIP', type: 'free-shipping', value: 0, minPurchase: 75, usageCount: 234, startDate: '2024-01-15', endDate: '2024-12-31', status: 'active', applicableTo: 'all' },
    { id: 'DSC-004', name: 'Buy One Get One', code: 'BOGO', type: 'bogo', value: 50, usageCount: 45, usageLimit: 100, startDate: '2024-02-01', endDate: '2024-02-14', status: 'expired', applicableTo: 'specific-products' },
    { id: 'DSC-005', name: '$20 Off Large Orders', code: 'SAVE20', type: 'fixed', value: 20, minPurchase: 150, usageCount: 56, startDate: '2024-02-01', endDate: '2024-03-31', status: 'active', applicableTo: 'all' },
    { id: 'DSC-006', name: 'VIP Member', code: 'VIP15', type: 'percentage', value: 15, usageCount: 0, startDate: '2024-04-01', endDate: '2024-12-31', status: 'disabled', applicableTo: 'all' },
  ]);

  const [showNewDiscount, setShowNewDiscount] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredDiscounts = discounts.filter(d => 
    filterStatus === 'all' || d.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      case 'disabled': return 'bg-slate-600/50 text-slate-400';
      default: return 'bg-slate-600/50 text-slate-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return '%';
      case 'fixed': return '$';
      case 'bogo': return '2×1';
      case 'free-shipping': return '🚚';
      default: return '🎫';
    }
  };

  const activeDiscounts = discounts.filter(d => d.status === 'active').length;
  const totalUsage = discounts.reduce((sum, d) => sum + d.usageCount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Discount Manager</h1>
          <button
            onClick={() => setShowNewDiscount(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            + Create Discount
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Discounts" value={discounts.length} icon="🎫" />
          <StatCard title="Active" value={activeDiscounts} icon="✅" />
          <StatCard title="Total Usage" value={totalUsage} icon="📊" />
          <StatCard title="Scheduled" value={discounts.filter(d => d.status === 'scheduled').length} icon="📅" />
        </div>

        {/* Filter */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-400">Filter by Status:</label>
            <div className="flex gap-2">
              {['all', 'active', 'scheduled', 'expired', 'disabled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    filterStatus === status ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Discounts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDiscounts.map((discount) => (
            <div key={discount.id} className="bg-slate-800 rounded-lg p-6 hover:ring-2 ring-blue-500 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl">{discount.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-slate-700 rounded text-sm font-mono text-blue-400">{discount.code}</code>
                    <span className="text-xs text-slate-400">{discount.id}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(discount.status)}`}>
                  {discount.status.toUpperCase()}
                </span>
              </div>

              {/* Discount Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {getTypeIcon(discount.type)}
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {discount.type === 'percentage' ? `${discount.value}%` :
                     discount.type === 'fixed' ? `$${discount.value}` :
                     discount.type === 'bogo' ? `${discount.value}%` : 'Free'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 capitalize">{discount.type.replace('-', ' ')}</div>
                </div>

                <div className="space-y-2">
                  {discount.minPurchase && (
                    <div className="p-2 bg-slate-700 rounded">
                      <div className="text-xs text-slate-400">Min Purchase</div>
                      <div className="font-semibold">${discount.minPurchase}</div>
                    </div>
                  )}
                  {discount.maxDiscount && (
                    <div className="p-2 bg-slate-700 rounded">
                      <div className="text-xs text-slate-400">Max Discount</div>
                      <div className="font-semibold">${discount.maxDiscount}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Usage</span>
                  <span className="text-sm font-medium">
                    {discount.usageCount} {discount.usageLimit ? `/ ${discount.usageLimit}` : ''}
                  </span>
                </div>
                {discount.usageLimit && (
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-green-500 rounded-full h-2"
                      style={{ width: `${Math.min((discount.usageCount / discount.usageLimit) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="mb-4 text-sm">
                <div className="flex items-center justify-between text-slate-400">
                  <span>📅 {new Date(discount.startDate).toLocaleDateString()}</span>
                  <span>→</span>
                  <span>{new Date(discount.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Applicable To */}
              <div className="mb-4">
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                  {discount.applicableTo.replace('-', ' ').toUpperCase()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium">
                  Edit
                </button>
                <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium">
                  Duplicate
                </button>
                <button className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* New Discount Modal */}
        {showNewDiscount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Create New Discount</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Discount Name</label>
                    <input type="text" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="e.g., Summer Sale" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Discount Code</label>
                    <input type="text" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="e.g., SUMMER25" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Discount Type</label>
                    <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg">
                      <option value="percentage">Percentage Off</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="bogo">Buy One Get One</option>
                      <option value="free-shipping">Free Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Value</label>
                    <input type="number" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Start Date</label>
                    <input type="date" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">End Date</label>
                    <input type="date" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Min Purchase (Optional)</label>
                    <input type="number" step="0.01" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Usage Limit (Optional)</label>
                    <input type="number" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="Unlimited" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Applicable To</label>
                  <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg">
                    <option value="all">All Products</option>
                    <option value="specific-products">Specific Products</option>
                    <option value="specific-categories">Specific Categories</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                  Create Discount
                </button>
                <button
                  onClick={() => setShowNewDiscount(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
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
