import React, { useState } from 'react';

interface Purchase {
  id: string;
  date: string;
  total: number;
  items: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  joinDate: string;
  totalSpent: number;
  totalPurchases: number;
  averageOrderValue: number;
  lastPurchase: string;
  loyaltyPoints: number;
  status: 'active' | 'inactive';
}

export default function CustomerDetail() {
  const [customer, setCustomer] = useState<Customer>({
    id: 'CUST-789',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    joinDate: '2023-05-15',
    totalSpent: 1247.85,
    totalPurchases: 24,
    averageOrderValue: 51.99,
    lastPurchase: '2024-02-13',
    loyaltyPoints: 1248,
    status: 'active'
  });

  const [recentPurchases] = useState<Purchase[]>([
    { id: 'TXN-001234', date: '2024-02-13', total: 119.84, items: 3 },
    { id: 'TXN-001189', date: '2024-02-08', total: 47.99, items: 2 },
    { id: 'TXN-001142', date: '2024-01-28', total: 89.97, items: 4 },
    { id: 'TXN-001098', date: '2024-01-15', total: 24.99, items: 1 },
  ]);

  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
    console.log('Saving customer:', customer);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button className="text-slate-400 hover:text-slate-300 mb-2">← Back to Customers</button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{customer.name}</h1>
              <p className="text-slate-400">Customer ID: {customer.id}</p>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                    Save Changes
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
                  Edit Customer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Spent" value={`$${customer.totalSpent.toFixed(2)}`} icon="💰" />
          <StatCard title="Total Orders" value={customer.totalPurchases.toString()} icon="📦" />
          <StatCard title="Avg Order Value" value={`$${customer.averageOrderValue.toFixed(2)}`} icon="📊" />
          <StatCard title="Loyalty Points" value={customer.loyaltyPoints.toString()} icon="⭐" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Name" value={customer.name} editing={editing} onChange={(v) => setCustomer({...customer, name: v})} />
                <InfoField label="Email" value={customer.email} editing={editing} onChange={(v) => setCustomer({...customer, email: v})} />
                <InfoField label="Phone" value={customer.phone} editing={editing} onChange={(v) => setCustomer({...customer, phone: v})} />
                <InfoField label="Status" value={customer.status} editing={editing} onChange={(v) => setCustomer({...customer, status: v as 'active' | 'inactive'})} />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Address</h2>
              <div className="grid grid-cols-1 gap-4">
                <InfoField label="Street Address" value={customer.address} editing={editing} onChange={(v) => setCustomer({...customer, address: v})} />
                <div className="grid grid-cols-3 gap-4">
                  <InfoField label="City" value={customer.city} editing={editing} onChange={(v) => setCustomer({...customer, city: v})} />
                  <InfoField label="State" value={customer.state} editing={editing} onChange={(v) => setCustomer({...customer, state: v})} />
                  <InfoField label="ZIP" value={customer.zip} editing={editing} onChange={(v) => setCustomer({...customer, zip: v})} />
                </div>
              </div>
            </div>

            {/* Recent Purchases */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Purchases</h2>
              <div className="space-y-2">
                {recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600/50">
                    <div>
                      <div className="font-medium text-blue-400">{purchase.id}</div>
                      <div className="text-sm text-slate-400">{new Date(purchase.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${purchase.total.toFixed(2)}</div>
                      <div className="text-sm text-slate-400">{purchase.items} items</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
                View All Purchases
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Account Status</h3>
              <div className={`px-4 py-2 rounded-lg text-center font-medium mb-4 ${
                customer.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'
              }`}>
                {customer.status === 'active' ? 'Active' : 'Inactive'}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Member Since:</span>
                  <span className="font-medium">{new Date(customer.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Purchase:</span>
                  <span className="font-medium">{new Date(customer.lastPurchase).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Loyalty Program</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-yellow-400">{customer.loyaltyPoints}</div>
                <div className="text-sm text-slate-400">Available Points</div>
              </div>
              <div className="text-xs text-slate-400 text-center">
                252 points until next reward tier
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div className="bg-yellow-400 rounded-full h-2" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                  Send Email
                </button>
                <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
                  Add Note
                </button>
                <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
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

function InfoField({ label, value, editing, onChange }: {
  label: string;
  value: string;
  editing: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      {editing && onChange ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"
        />
      ) : (
        <div className="text-lg">{value}</div>
      )}
    </div>
  );
}
