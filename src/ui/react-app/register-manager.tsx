import React, { useState } from 'react';

interface Register {
  id: string;
  name: string;
  status: 'open' | 'closed' | 'in-use';
  cashier?: string;
  openedAt?: string;
  openingBalance: number;
  currentBalance: number;
  totalSales: number;
  transactionCount: number;
  lastTransaction?: string;
}

export default function RegisterManager() {
  const [registers, setRegisters] = useState<Register[]>([
    { id: 'REG-001', name: 'Register 1', status: 'in-use', cashier: 'Sarah Johnson', openedAt: '2024-02-13 9:00 AM', openingBalance: 200.00, currentBalance: 847.50, totalSales: 647.50, transactionCount: 24, lastTransaction: '2:45 PM' },
    { id: 'REG-002', name: 'Register 2', status: 'in-use', cashier: 'Mike Davis', openedAt: '2024-02-13 9:15 AM', openingBalance: 200.00, currentBalance: 1123.75, totalSales: 923.75, transactionCount: 18, lastTransaction: '2:38 PM' },
    { id: 'REG-003', name: 'Register 3', status: 'closed', openingBalance: 200.00, currentBalance: 200.00, totalSales: 0, transactionCount: 0 },
    { id: 'REG-004', name: 'Register 4', status: 'open', cashier: 'Emily Chen', openedAt: '2024-02-13 12:00 PM', openingBalance: 150.00, currentBalance: 378.25, totalSales: 228.25, transactionCount: 9, lastTransaction: '2:22 PM' },
  ]);

  const [showOpenRegister, setShowOpenRegister] = useState(false);
  const [showCloseRegister, setShowCloseRegister] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-use': return 'bg-green-500/20 text-green-400';
      case 'open': return 'bg-blue-500/20 text-blue-400';
      case 'closed': return 'bg-slate-600/50 text-slate-400';
      default: return 'bg-slate-600/50 text-slate-400';
    }
  };

  const totalActiveSales = registers
    .filter(r => r.status !== 'closed')
    .reduce((sum, r) => sum + r.totalSales, 0);

  const totalTransactions = registers
    .filter(r => r.status !== 'closed')
    .reduce((sum, r) => sum + r.transactionCount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Register Manager</h1>
          <button
            onClick={() => setShowOpenRegister(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            Open Register
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Active Registers" value={registers.filter(r => r.status !== 'closed').length} icon="🏪" />
          <StatCard title="Total Sales Today" value={`$${totalActiveSales.toFixed(2)}`} icon="💰" />
          <StatCard title="Total Transactions" value={totalTransactions} icon="🧾" />
          <StatCard title="Avg Transaction" value={`$${totalTransactions > 0 ? (totalActiveSales / totalTransactions).toFixed(2) : '0.00'}`} icon="📊" />
        </div>

        {/* Register Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {registers.map((register) => (
            <div key={register.id} className="bg-slate-800 rounded-lg p-6 border-2 border-transparent hover:border-blue-500/50 transition-all">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{register.name}</h3>
                  <p className="text-sm text-slate-400">{register.id}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(register.status)}`}>
                  {register.status.toUpperCase().replace('-', ' ')}
                </span>
              </div>

              {/* Cashier Info */}
              {register.cashier && (
                <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">👤</span>
                    <span className="font-medium">{register.cashier}</span>
                  </div>
                  {register.openedAt && (
                    <div className="text-sm text-slate-400">Opened at {register.openedAt}</div>
                  )}
                </div>
              )}

              {/* Financial Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Opening Balance</div>
                  <div className="text-lg font-bold">${register.openingBalance.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Current Balance</div>
                  <div className="text-lg font-bold text-green-400">${register.currentBalance.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Total Sales</div>
                  <div className="text-lg font-bold text-blue-400">${register.totalSales.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Transactions</div>
                  <div className="text-lg font-bold">{register.transactionCount}</div>
                </div>
              </div>

              {register.lastTransaction && (
                <div className="text-sm text-slate-400 mb-4">
                  Last transaction: {register.lastTransaction}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {register.status === 'closed' ? (
                  <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
                    Open Register
                  </button>
                ) : (
                  <>
                    <button className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium">
                      View Details
                    </button>
                    <button
                      onClick={() => setShowCloseRegister(register.id)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                    >
                      Close Register
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Open Register Modal */}
        {showOpenRegister && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Open Register</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Select Register</label>
                  <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg">
                    {registers.filter(r => r.status === 'closed').map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Cashier Name</label>
                  <input type="text" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="Enter cashier name" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Opening Balance</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="200.00" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                  Open Register
                </button>
                <button
                  onClick={() => setShowOpenRegister(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Register Modal */}
        {showCloseRegister && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Close Register</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="text-sm text-slate-400">Register to Close</div>
                  <div className="font-bold">{registers.find(r => r.id === showCloseRegister)?.name}</div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Actual Cash Count</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="Enter counted cash" />
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                  <div className="text-sm text-yellow-400">⚠️ This will close the register and end the current session</div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium">
                  Close Register
                </button>
                <button
                  onClick={() => setShowCloseRegister(null)}
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
