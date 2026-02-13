import React, { useState } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  status: 'active' | 'inactive';
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export default function CustomerGrid() {
  const [customers] = useState<Customer[]>([
    { id: 'CUST-789', name: 'John Smith', email: 'john.smith@email.com', phone: '(555) 123-4567', totalSpent: 1247.85, totalOrders: 24, lastPurchase: '2024-02-13', status: 'active', loyaltyTier: 'gold' },
    { id: 'CUST-790', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '(555) 234-5678', totalSpent: 2156.40, totalOrders: 38, lastPurchase: '2024-02-12', status: 'active', loyaltyTier: 'platinum' },
    { id: 'CUST-791', name: 'Michael Brown', email: 'mbrown@email.com', phone: '(555) 345-6789', totalSpent: 445.20, totalOrders: 8, lastPurchase: '2024-02-10', status: 'active', loyaltyTier: 'silver' },
    { id: 'CUST-792', name: 'Emily Davis', email: 'emily.d@email.com', phone: '(555) 456-7890', totalSpent: 892.75, totalOrders: 15, lastPurchase: '2024-02-08', status: 'active', loyaltyTier: 'gold' },
    { id: 'CUST-793', name: 'David Wilson', email: 'dwilson@email.com', phone: '(555) 567-8901', totalSpent: 156.30, totalOrders: 3, lastPurchase: '2024-01-22', status: 'inactive', loyaltyTier: 'bronze' },
    { id: 'CUST-794', name: 'Lisa Anderson', email: 'l.anderson@email.com', phone: '(555) 678-9012', totalSpent: 3421.90, totalOrders: 52, lastPurchase: '2024-02-13', status: 'active', loyaltyTier: 'platinum' },
    { id: 'CUST-795', name: 'Robert Taylor', email: 'rtaylor@email.com', phone: '(555) 789-0123', totalSpent: 678.50, totalOrders: 12, lastPurchase: '2024-02-11', status: 'active', loyaltyTier: 'silver' },
    { id: 'CUST-796', name: 'Jennifer Martinez', email: 'jmartinez@email.com', phone: '(555) 890-1234', totalSpent: 1034.25, totalOrders: 19, lastPurchase: '2024-02-09', status: 'active', loyaltyTier: 'gold' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'spent' | 'orders' | 'recent'>('recent');

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
      const matchesTier = filterTier === 'all' || customer.loyaltyTier === filterTier;
      return matchesSearch && matchesStatus && matchesTier;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'spent': return b.totalSpent - a.totalSpent;
        case 'orders': return b.totalOrders - a.totalOrders;
        case 'recent': return new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime();
        default: return 0;
      }
    });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-500/20 text-purple-400';
      case 'gold': return 'bg-yellow-500/20 text-yellow-400';
      case 'silver': return 'bg-slate-400/20 text-slate-300';
      default: return 'bg-amber-700/20 text-amber-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Customer Directory</h1>

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Search</label>
              <input
                type="text"
                placeholder="Name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Loyalty Tier</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="recent">Recent Purchase</option>
                <option value="name">Name</option>
                <option value="spent">Total Spent</option>
                <option value="orders">Total Orders</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-slate-400 mb-4">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-slate-800 rounded-lg p-5 hover:ring-2 ring-blue-500 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{customer.name}</h3>
                  <p className="text-sm text-slate-400">{customer.id}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(customer.loyaltyTier)}`}>
                  {customer.loyaltyTier.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>📧</span>
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>📱</span>
                  <span>{customer.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-slate-700">
                <div>
                  <div className="text-xs text-slate-400">Total Spent</div>
                  <div className="text-lg font-bold text-green-400">${customer.totalSpent.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Orders</div>
                  <div className="text-lg font-bold text-blue-400">{customer.totalOrders}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <div>
                  <div className="text-xs text-slate-400">Last Purchase</div>
                  <div className="text-sm font-medium">{new Date(customer.lastPurchase).toLocaleDateString()}</div>
                </div>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium">
                  View
                </button>
              </div>

              {customer.status === 'inactive' && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">Inactive</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No customers found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
