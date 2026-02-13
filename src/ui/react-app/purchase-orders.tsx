import React, { useState } from 'react';

interface PurchaseOrderItem {
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  status: 'draft' | 'pending' | 'ordered' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
}

export default function PurchaseOrders() {
  const [orders] = useState<PurchaseOrder[]>([
    {
      id: 'PO-001',
      orderNumber: 'PO-2024-0213-001',
      supplier: 'Colombian Coffee Co.',
      orderDate: '2024-02-13',
      expectedDelivery: '2024-02-20',
      status: 'ordered',
      items: [
        { productName: 'Premium Coffee Beans', sku: 'COF001', quantity: 100, unitCost: 12.50, total: 1250.00 },
        { productName: 'Organic Coffee Beans', sku: 'COF002', quantity: 50, unitCost: 15.00, total: 750.00 },
      ],
      subtotal: 2000.00,
      tax: 160.00,
      shipping: 75.00,
      total: 2235.00,
      notes: 'Rush order for spring promotion'
    },
    {
      id: 'PO-002',
      orderNumber: 'PO-2024-0212-001',
      supplier: 'Equipment Suppliers Inc.',
      orderDate: '2024-02-12',
      expectedDelivery: '2024-02-19',
      status: 'pending',
      items: [
        { productName: 'Espresso Machine Pro', sku: 'MAC002', quantity: 5, unitCost: 650.00, total: 3250.00 },
        { productName: 'Grinder Commercial', sku: 'MAC003', quantity: 3, unitCost: 425.00, total: 1275.00 },
      ],
      subtotal: 4525.00,
      tax: 362.00,
      shipping: 125.00,
      total: 5012.00
    },
    {
      id: 'PO-003',
      orderNumber: 'PO-2024-0210-001',
      supplier: 'Tea Imports Ltd.',
      orderDate: '2024-02-10',
      expectedDelivery: '2024-02-15',
      status: 'received',
      items: [
        { productName: 'Green Tea Premium', sku: 'TEA002', quantity: 200, unitCost: 7.50, total: 1500.00 },
        { productName: 'Earl Grey', sku: 'TEA003', quantity: 150, unitCost: 8.25, total: 1237.50 },
      ],
      subtotal: 2737.50,
      tax: 219.00,
      shipping: 50.00,
      total: 3006.50
    },
    {
      id: 'PO-004',
      orderNumber: 'PO-2024-0208-001',
      supplier: 'Accessories Direct',
      orderDate: '2024-02-08',
      expectedDelivery: '2024-02-14',
      status: 'draft',
      items: [
        { productName: 'Ceramic Mugs', sku: 'MUG001', quantity: 300, unitCost: 5.50, total: 1650.00 },
        { productName: 'Coffee Filters', sku: 'ACC002', quantity: 500, unitCost: 2.99, total: 1495.00 },
      ],
      subtotal: 3145.00,
      tax: 251.60,
      shipping: 85.00,
      total: 3481.60
    },
  ]);

  const [showNewOrder, setShowNewOrder] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filteredOrders = orders.filter(order => 
    filterStatus === 'all' || order.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-600/50 text-slate-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'ordered': return 'bg-blue-500/20 text-blue-400';
      case 'received': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-600/50 text-slate-400';
    }
  };

  const totalValue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingValue = orders.filter(o => o.status === 'pending' || o.status === 'ordered').reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <button
            onClick={() => setShowNewOrder(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            + New Purchase Order
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Orders" value={orders.length} icon="📋" />
          <StatCard title="Pending" value={orders.filter(o => o.status === 'pending' || o.status === 'ordered').length} icon="⏳" />
          <StatCard title="Total Value" value={`$${totalValue.toFixed(2)}`} icon="💰" />
          <StatCard title="Pending Value" value={`$${pendingValue.toFixed(2)}`} icon="📊" />
        </div>

        {/* Filter */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-400">Filter by Status:</label>
            <div className="flex gap-2">
              {['all', 'draft', 'pending', 'ordered', 'received', 'cancelled'].map(status => (
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

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-slate-800 rounded-lg p-6 hover:ring-2 ring-blue-500 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{order.orderNumber}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                    <span>🏢 {order.supplier}</span>
                    <span>📅 Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                    <span>🚚 Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              {/* Items Summary */}
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">{order.items.length} items</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <div>
                        <div className="font-medium text-sm">{item.productName}</div>
                        <div className="text-xs text-slate-400">{item.sku} • Qty: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${item.total.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">${item.unitCost.toFixed(2)} each</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-4 gap-4 mb-4 pt-4 border-t border-slate-700">
                <div>
                  <div className="text-xs text-slate-400">Subtotal</div>
                  <div className="font-semibold">${order.subtotal.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Tax</div>
                  <div className="font-semibold">${order.tax.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Shipping</div>
                  <div className="font-semibold">${order.shipping.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="text-xl font-bold text-green-400">${order.total.toFixed(2)}</div>
                </div>
              </div>

              {order.notes && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded text-sm">
                  <strong>Notes:</strong> {order.notes}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedOrder(order.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                >
                  View Details
                </button>
                {order.status === 'draft' && (
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium">
                    Submit Order
                  </button>
                )}
                {order.status === 'ordered' && (
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium">
                    Mark as Received
                  </button>
                )}
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium">
                  Print
                </button>
                {order.status === 'draft' && (
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium ml-auto">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* New Order Modal */}
        {showNewOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Create Purchase Order</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Supplier</label>
                    <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg">
                      <option>Colombian Coffee Co.</option>
                      <option>Equipment Suppliers Inc.</option>
                      <option>Tea Imports Ltd.</option>
                      <option>Accessories Direct</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Expected Delivery</label>
                    <input type="date" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Notes (Optional)</label>
                  <textarea className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg resize-none" rows={2}></textarea>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <h3 className="font-semibold mb-3">Items</h3>
                  <button className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium border-2 border-dashed border-slate-600">
                    + Add Product
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium">
                  Save as Draft
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                  Submit Order
                </button>
                <button
                  onClick={() => setShowNewOrder(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg font-medium"
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
