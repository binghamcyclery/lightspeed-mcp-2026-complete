import React, { useState } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  status: 'active' | 'inactive';
}

export default function ProductGrid() {
  const [products] = useState<Product[]>([
    { id: '1', name: 'Premium Coffee Beans', sku: 'COF001', price: 24.99, stock: 45, category: 'Coffee', status: 'active' },
    { id: '2', name: 'Espresso Machine', sku: 'MAC001', price: 899.99, stock: 3, category: 'Equipment', status: 'active' },
    { id: '3', name: 'Ceramic Mug', sku: 'MUG001', price: 12.99, stock: 0, category: 'Accessories', status: 'active' },
    { id: '4', name: 'Tea Assortment', sku: 'TEA001', price: 19.99, stock: 8, category: 'Tea', status: 'active' },
    { id: '5', name: 'Milk Frother', sku: 'ACC001', price: 49.99, stock: 12, category: 'Accessories', status: 'inactive' },
    { id: '6', name: 'Cold Brew Maker', sku: 'EQP002', price: 79.99, stock: 15, category: 'Equipment', status: 'active' },
    { id: '7', name: 'Green Tea', sku: 'TEA002', price: 14.99, stock: 22, category: 'Tea', status: 'active' },
    { id: '8', name: 'Coffee Filters', sku: 'ACC002', price: 6.99, stock: 100, category: 'Accessories', status: 'active' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Product Grid</h1>

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
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
          </div>
        </div>

        {/* Results Count */}
        <div className="text-slate-400 mb-4">
          Showing {filteredProducts.length} of {products.length} products
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-slate-800 rounded-lg overflow-hidden hover:ring-2 ring-blue-500 transition-all">
              {/* Image Placeholder */}
              <div className="bg-slate-700 h-48 flex items-center justify-center text-4xl">
                {product.category === 'Coffee' ? '☕' :
                 product.category === 'Equipment' ? '⚙️' :
                 product.category === 'Tea' ? '🍵' : '📦'}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg leading-tight flex-1">{product.name}</h3>
                  {product.status === 'inactive' && (
                    <span className="ml-2 px-2 py-1 bg-slate-600 text-slate-400 text-xs rounded">Inactive</span>
                  )}
                </div>
                
                <p className="text-sm text-slate-400 mb-3">SKU: {product.sku}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">{product.category}</span>
                  <span className={`text-sm ${
                    product.stock === 0 ? 'text-red-400' :
                    product.stock < 10 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    Stock: {product.stock}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-400">${product.price.toFixed(2)}</span>
                  <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No products found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
