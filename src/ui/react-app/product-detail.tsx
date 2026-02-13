import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  supplier: string;
  barcode: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetail() {
  const [product, setProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading a product
    setTimeout(() => {
      setProduct({
        id: '1',
        name: 'Premium Coffee Beans',
        sku: 'COF001',
        description: 'High-quality Arabica coffee beans sourced from Colombia. Medium roast with notes of chocolate and caramel.',
        price: 24.99,
        cost: 12.50,
        stock: 45,
        category: 'Coffee',
        supplier: 'Colombian Coffee Co.',
        barcode: '1234567890123',
        status: 'active',
        createdAt: '2024-01-15',
        updatedAt: '2024-02-10'
      });
      setLoading(false);
    }, 500);
  }, []);

  const handleSave = () => {
    setEditing(false);
    // In real app: save to API
    console.log('Saving product:', product);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading product...</div>
      </div>
    );
  }

  if (!product) return null;

  const margin = ((product.price - product.cost) / product.price * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button className="text-slate-400 hover:text-slate-300 mb-2">← Back to Products</button>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-slate-400">SKU: {product.sku}</p>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
              >
                Edit Product
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Product Information</h2>
              <div className="space-y-4">
                <InfoField label="Name" value={product.name} editing={editing} onChange={(v) => setProduct({...product, name: v})} />
                <InfoField label="Description" value={product.description} editing={editing} multiline onChange={(v) => setProduct({...product, description: v})} />
                <InfoField label="Category" value={product.category} editing={editing} onChange={(v) => setProduct({...product, category: v})} />
                <InfoField label="Supplier" value={product.supplier} editing={editing} onChange={(v) => setProduct({...product, supplier: v})} />
                <InfoField label="Barcode" value={product.barcode} editing={editing} onChange={(v) => setProduct({...product, barcode: v})} />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Pricing & Inventory</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Retail Price" value={`$${product.price.toFixed(2)}`} editing={editing} onChange={(v) => setProduct({...product, price: parseFloat(v.replace('$', ''))})} />
                <InfoField label="Cost" value={`$${product.cost.toFixed(2)}`} editing={editing} onChange={(v) => setProduct({...product, cost: parseFloat(v.replace('$', ''))})} />
                <InfoField label="Stock Quantity" value={product.stock.toString()} editing={editing} onChange={(v) => setProduct({...product, stock: parseInt(v)})} />
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Margin</label>
                  <div className="text-lg font-semibold text-green-400">{margin}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Product Status</label>
                  <select
                    value={product.status}
                    disabled={!editing}
                    onChange={(e) => setProduct({...product, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className={`px-3 py-2 rounded-lg text-center font-medium ${
                  product.stock === 0 ? 'bg-red-500/20 text-red-400' :
                  product.stock < 10 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {product.stock === 0 ? 'Out of Stock' :
                   product.stock < 10 ? 'Low Stock' : 'In Stock'}
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Timestamps</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Created:</span>
                  <div className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-slate-400">Last Updated:</span>
                  <div className="font-medium">{new Date(product.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, editing, multiline, onChange }: {
  label: string;
  value: string;
  editing: boolean;
  multiline?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      {editing && onChange ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg resize-none"
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"
          />
        )
      ) : (
        <div className="text-lg">{value}</div>
      )}
    </div>
  );
}
