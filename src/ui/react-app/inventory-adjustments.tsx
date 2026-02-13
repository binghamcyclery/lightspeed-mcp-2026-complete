import React, { useState } from 'react';

interface Adjustment {
  id: string;
  date: string;
  productName: string;
  sku: string;
  type: 'addition' | 'removal' | 'correction' | 'damage' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
}

export default function InventoryAdjustments() {
  const [adjustments] = useState<Adjustment[]>([
    { id: 'ADJ-001', date: '2024-02-13 2:30 PM', productName: 'Premium Coffee Beans', sku: 'COF001', type: 'addition', quantity: 50, previousStock: 45, newStock: 95, reason: 'New shipment received', performedBy: 'Sarah Johnson' },
    { id: 'ADJ-002', date: '2024-02-13 1:15 PM', productName: 'Ceramic Mug', sku: 'MUG001', type: 'damage', quantity: -5, previousStock: 25, newStock: 20, reason: 'Broken during transit', performedBy: 'Mike Davis' },
    { id: 'ADJ-003', date: '2024-02-13 10:45 AM', productName: 'Espresso Machine', sku: 'MAC001', type: 'correction', quantity: 2, previousStock: 1, newStock: 3, reason: 'Inventory count correction', performedBy: 'Admin' },
    { id: 'ADJ-004', date: '2024-02-12 4:20 PM', productName: 'Tea Assortment', sku: 'TEA001', type: 'removal', quantity: -10, previousStock: 18, newStock: 8, reason: 'Expired product disposal', performedBy: 'Sarah Johnson' },
    { id: 'ADJ-005', date: '2024-02-12 11:00 AM', productName: 'Milk Frother', sku: 'ACC001', type: 'transfer', quantity: -5, previousStock: 17, newStock: 12, reason: 'Transferred to Store #2', performedBy: 'Mike Davis' },
  ]);

  const [showNewAdjustment, setShowNewAdjustment] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const filteredAdjustments = adjustments.filter(adj => 
    filterType === 'all' || adj.type === filterType
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'addition': return 'bg-green-500/20 text-green-400';
      case 'removal': return 'bg-orange-500/20 text-orange-400';
      case 'correction': return 'bg-blue-500/20 text-blue-400';
      case 'damage': return 'bg-red-500/20 text-red-400';
      case 'transfer': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-600/50 text-slate-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'addition': return '➕';
      case 'removal': return '➖';
      case 'correction': return '✏️';
      case 'damage': return '⚠️';
      case 'transfer': return '↔️';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Inventory Adjustments</h1>
          <button
            onClick={() => setShowNewAdjustment(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            + New Adjustment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <TypeStat type="Addition" count={adjustments.filter(a => a.type === 'addition').length} icon="➕" />
          <TypeStat type="Removal" count={adjustments.filter(a => a.type === 'removal').length} icon="➖" />
          <TypeStat type="Correction" count={adjustments.filter(a => a.type === 'correction').length} icon="✏️" />
          <TypeStat type="Damage" count={adjustments.filter(a => a.type === 'damage').length} icon="⚠️" />
          <TypeStat type="Transfer" count={adjustments.filter(a => a.type === 'transfer').length} icon="↔️" />
        </div>

        {/* Filter */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-400">Filter by Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="addition">Addition</option>
              <option value="removal">Removal</option>
              <option value="correction">Correction</option>
              <option value="damage">Damage</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>

        {/* Adjustments List */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Date & Time</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Product</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Type</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Quantity Change</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Stock Change</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Reason</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Performed By</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdjustments.map((adj) => (
                  <tr key={adj.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="py-4 px-4">
                      <div className="font-medium">{adj.date}</div>
                      <div className="text-xs text-slate-400">{adj.id}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium">{adj.productName}</div>
                      <div className="text-sm text-slate-400">{adj.sku}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${getTypeColor(adj.type)}`}>
                          <span>{getTypeIcon(adj.type)}</span>
                          <span>{adj.type.charAt(0).toUpperCase() + adj.type.slice(1)}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-lg font-bold ${adj.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm">
                        <span className="text-slate-400">{adj.previousStock}</span>
                        <span className="mx-2">→</span>
                        <span className="font-semibold">{adj.newStock}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{adj.reason}</td>
                    <td className="py-4 px-4 text-slate-400">{adj.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Adjustment Modal */}
        {showNewAdjustment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-6">New Inventory Adjustment</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Product SKU</label>
                    <input type="text" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Adjustment Type</label>
                    <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg">
                      <option value="addition">Addition</option>
                      <option value="removal">Removal</option>
                      <option value="correction">Correction</option>
                      <option value="damage">Damage</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Quantity Change</label>
                  <input type="number" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Reason</label>
                  <textarea className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg resize-none" rows={3}></textarea>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                  Submit Adjustment
                </button>
                <button
                  onClick={() => setShowNewAdjustment(false)}
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

function TypeStat({ type, count, icon }: { type: string; count: number; icon: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{type}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{count}</div>
    </div>
  );
}
