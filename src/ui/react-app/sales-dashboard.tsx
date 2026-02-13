import React, { useState } from 'react';

interface SalesData {
  today: number;
  week: number;
  month: number;
  year: number;
}

interface Transaction {
  id: string;
  time: string;
  items: number;
  total: number;
  paymentMethod: string;
  register: string;
}

export default function SalesDashboard() {
  const [sales] = useState<SalesData>({
    today: 1247.50,
    week: 8932.25,
    month: 34567.80,
    year: 412345.60
  });

  const [recentTransactions] = useState<Transaction[]>([
    { id: 'TXN-001', time: '2:45 PM', items: 3, total: 47.97, paymentMethod: 'Credit Card', register: 'Register 1' },
    { id: 'TXN-002', time: '2:38 PM', items: 1, total: 899.99, paymentMethod: 'Debit Card', register: 'Register 2' },
    { id: 'TXN-003', time: '2:22 PM', items: 5, total: 112.45, paymentMethod: 'Cash', register: 'Register 1' },
    { id: 'TXN-004', time: '2:15 PM', items: 2, total: 37.98, paymentMethod: 'Credit Card', register: 'Register 1' },
    { id: 'TXN-005', time: '1:58 PM', items: 4, total: 149.96, paymentMethod: 'Mobile Pay', register: 'Register 2' },
  ]);

  const [hourlyData] = useState([
    { hour: '9 AM', sales: 120 },
    { hour: '10 AM', sales: 280 },
    { hour: '11 AM', sales: 450 },
    { hour: '12 PM', sales: 620 },
    { hour: '1 PM', sales: 380 },
    { hour: '2 PM', sales: 520 },
  ]);

  const maxSales = Math.max(...hourlyData.map(d => d.sales));
  const avgTransactionValue = sales.today / recentTransactions.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sales Dashboard</h1>

        {/* Sales Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Today's Sales" value={`$${sales.today.toFixed(2)}`} icon="📊" trend="+12%" />
          <StatCard title="This Week" value={`$${sales.week.toFixed(2)}`} icon="📈" trend="+8%" />
          <StatCard title="This Month" value={`$${sales.month.toFixed(2)}`} icon="💰" trend="+15%" />
          <StatCard title="This Year" value={`$${sales.year.toFixed(2)}`} icon="🎯" trend="+22%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Hourly Chart */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Hourly Sales</h2>
            <div className="space-y-3">
              {hourlyData.map((data) => (
                <div key={data.hour} className="flex items-center gap-3">
                  <span className="text-sm text-slate-400 w-16">{data.hour}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-3"
                      style={{ width: `${(data.sales / maxSales) * 100}%` }}
                    >
                      <span className="text-white text-sm font-medium">${data.sales}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div>
                  <div className="text-sm text-slate-400">Total Transactions</div>
                  <div className="text-2xl font-bold text-blue-400">{recentTransactions.length}</div>
                </div>
                <span className="text-3xl">🧾</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div>
                  <div className="text-sm text-slate-400">Avg Transaction</div>
                  <div className="text-2xl font-bold text-green-400">${avgTransactionValue.toFixed(2)}</div>
                </div>
                <span className="text-3xl">💵</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div>
                  <div className="text-sm text-slate-400">Items Sold</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {recentTransactions.reduce((sum, t) => sum + t.items, 0)}
                  </div>
                </div>
                <span className="text-3xl">📦</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Transaction ID</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Time</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Items</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Payment</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Register</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-medium text-blue-400">{txn.id}</td>
                    <td className="py-3 px-4 text-slate-300">{txn.time}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{txn.items}</td>
                    <td className="py-3 px-4 text-right font-semibold">${txn.total.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-400">{txn.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-400">{txn.register}</td>
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

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: string; trend?: string }) {
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
          {trend} vs yesterday
        </div>
      )}
    </div>
  );
}
