import React, { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'active' | 'on-break' | 'off-duty';
  clockedIn?: string;
  todaySales: number;
  todayTransactions: number;
  hoursWorked: number;
}

export default function EmployeeDashboard() {
  const [employees] = useState<Employee[]>([
    { id: 'EMP-001', name: 'Sarah Johnson', role: 'Senior Cashier', email: 'sarah.j@store.com', phone: '(555) 111-2222', status: 'active', clockedIn: '9:00 AM', todaySales: 647.50, todayTransactions: 24, hoursWorked: 5.75 },
    { id: 'EMP-002', name: 'Mike Davis', role: 'Cashier', email: 'mike.d@store.com', phone: '(555) 222-3333', status: 'active', clockedIn: '9:15 AM', todaySales: 923.75, todayTransactions: 18, hoursWorked: 5.67 },
    { id: 'EMP-003', name: 'Emily Chen', role: 'Supervisor', email: 'emily.c@store.com', phone: '(555) 333-4444', status: 'on-break', clockedIn: '8:00 AM', todaySales: 228.25, todayTransactions: 9, hoursWorked: 6.5 },
    { id: 'EMP-004', name: 'James Wilson', role: 'Stock Clerk', email: 'james.w@store.com', phone: '(555) 444-5555', status: 'active', clockedIn: '10:00 AM', todaySales: 0, todayTransactions: 0, hoursWorked: 4.75 },
    { id: 'EMP-005', name: 'Lisa Anderson', role: 'Manager', email: 'lisa.a@store.com', phone: '(555) 555-6666', status: 'off-duty', todaySales: 0, todayTransactions: 0, hoursWorked: 0 },
  ]);

  const [filterStatus, setFilterStatus] = useState('all');

  const filteredEmployees = employees.filter(emp => 
    filterStatus === 'all' || emp.status === filterStatus
  );

  const activeEmployees = employees.filter(e => e.status !== 'off-duty').length;
  const totalSalesToday = employees.reduce((sum, e) => sum + e.todaySales, 0);
  const totalTransactions = employees.reduce((sum, e) => sum + e.todayTransactions, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'on-break': return 'bg-yellow-500/20 text-yellow-400';
      case 'off-duty': return 'bg-slate-600/50 text-slate-400';
      default: return 'bg-slate-600/50 text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'on-break': return '☕';
      case 'off-duty': return '🏠';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Employee Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Employees" value={employees.length} icon="👥" />
          <StatCard title="Currently Active" value={activeEmployees} icon="✅" />
          <StatCard title="Total Sales Today" value={`$${totalSalesToday.toFixed(2)}`} icon="💰" />
          <StatCard title="Total Transactions" value={totalTransactions} icon="🧾" />
        </div>

        {/* Filter */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-400">Filter by Status:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'all' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'active' ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('on-break')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'on-break' ? 'bg-yellow-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                On Break
              </button>
              <button
                onClick={() => setFilterStatus('off-duty')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'off-duty' ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                Off Duty
              </button>
            </div>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-slate-800 rounded-lg p-6 hover:ring-2 ring-blue-500 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{employee.name}</h3>
                    <p className="text-sm text-slate-400">{employee.role}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(employee.status)}`}>
                  <span>{getStatusIcon(employee.status)}</span>
                  <span>{employee.status.toUpperCase().replace('-', ' ')}</span>
                </span>
              </div>

              {/* Contact Info */}
              <div className="mb-4 p-3 bg-slate-700 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <span>📧</span>
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span>📱</span>
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span>🆔</span>
                  <span>{employee.id}</span>
                </div>
              </div>

              {/* Today's Stats */}
              {employee.clockedIn && (
                <>
                  <div className="text-sm text-slate-400 mb-3">
                    Clocked in at {employee.clockedIn} • {employee.hoursWorked.toFixed(2)} hours worked
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <div className="text-xs text-slate-400 mb-1">Sales</div>
                      <div className="font-bold text-green-400">${employee.todaySales.toFixed(0)}</div>
                    </div>
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <div className="text-xs text-slate-400 mb-1">Trans.</div>
                      <div className="font-bold text-blue-400">{employee.todayTransactions}</div>
                    </div>
                    <div className="p-3 bg-slate-700 rounded-lg">
                      <div className="text-xs text-slate-400 mb-1">Avg Sale</div>
                      <div className="font-bold text-purple-400">
                        ${employee.todayTransactions > 0 ? (employee.todaySales / employee.todayTransactions).toFixed(0) : '0'}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium">
                  View Profile
                </button>
                <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium">
                  Schedule
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No employees found matching your filter.
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
