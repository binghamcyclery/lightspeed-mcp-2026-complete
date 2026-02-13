import React, { useState } from 'react';

interface SaleItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface Sale {
  id: string;
  date: string;
  time: string;
  customerName?: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  register: string;
  cashier: string;
  status: 'completed' | 'refunded' | 'partial-refund';
}

export default function SalesDetail() {
  const [sale] = useState<Sale>({
    id: 'TXN-001234',
    date: '2024-02-13',
    time: '2:45 PM',
    customerName: 'John Smith',
    customerId: 'CUST-789',
    items: [
      { id: '1', productName: 'Premium Coffee Beans', sku: 'COF001', quantity: 2, unitPrice: 24.99, discount: 0, total: 49.98 },
      { id: '2', productName: 'Ceramic Mug', sku: 'MUG001', quantity: 1, unitPrice: 12.99, discount: 2.00, total: 10.99 },
      { id: '3', productName: 'Milk Frother', sku: 'ACC001', quantity: 1, unitPrice: 49.99, discount: 0, total: 49.99 },
    ],
    subtotal: 110.96,
    tax: 8.88,
    total: 119.84,
    paymentMethod: 'Credit Card (****4532)',
    register: 'Register 1',
    cashier: 'Sarah Johnson',
    status: 'completed'
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button className="text-slate-400 hover:text-slate-300 mb-2">← Back to Sales</button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sale #{sale.id}</h1>
              <p className="text-slate-400">{new Date(sale.date).toLocaleDateString()} at {sale.time}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Print Receipt</button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">Issue Refund</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Items Purchased</h2>
              <div className="space-y-3">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-700 rounded-lg">
                    <div className="w-16 h-16 bg-slate-600 rounded flex items-center justify-center text-2xl">
                      📦
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{item.productName}</div>
                      <div className="text-sm text-slate-400">SKU: {item.sku}</div>
                      <div className="text-sm text-slate-400">
                        ${item.unitPrice.toFixed(2)} × {item.quantity}
                        {item.discount > 0 && <span className="text-green-400 ml-2">-${item.discount.toFixed(2)} discount</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">${item.total.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-slate-700 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>${sale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tax (8%):</span>
                  <span>${sale.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-700">
                  <span>Total:</span>
                  <span className="text-green-400">${sale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Transaction Timeline</h2>
              <div className="space-y-4">
                <TimelineEvent time="2:45:32 PM" event="Transaction completed" icon="✅" />
                <TimelineEvent time="2:45:28 PM" event="Payment processed" icon="💳" />
                <TimelineEvent time="2:45:15 PM" event="Items scanned" icon="📊" />
                <TimelineEvent time="2:45:00 PM" event="Transaction started" icon="🛒" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              <div className={`px-4 py-2 rounded-lg text-center font-medium ${
                sale.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                sale.status === 'refunded' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {sale.status === 'completed' ? 'Completed' :
                 sale.status === 'refunded' ? 'Refunded' : 'Partial Refund'}
              </div>
            </div>

            {/* Customer Info */}
            {sale.customerName && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Customer</h3>
                <div className="space-y-2">
                  <div className="font-medium text-blue-400">{sale.customerName}</div>
                  <div className="text-sm text-slate-400">ID: {sale.customerId}</div>
                  <button className="text-sm text-blue-400 hover:text-blue-300">View Profile →</button>
                </div>
              </div>
            )}

            {/* Transaction Details */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <DetailRow label="Payment Method" value={sale.paymentMethod} />
                <DetailRow label="Register" value={sale.register} />
                <DetailRow label="Cashier" value={sale.cashier} />
                <DetailRow label="Items Count" value={sale.items.length.toString()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({ time, event, icon }: { time: string; event: string; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-lg">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{event}</div>
        <div className="text-sm text-slate-400">{time}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
