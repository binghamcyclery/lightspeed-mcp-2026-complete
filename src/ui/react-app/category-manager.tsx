import React, { useState } from 'react';

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  totalValue: number;
  icon: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([
    { id: 'CAT-001', name: 'Coffee', description: 'Coffee beans and grounds', productCount: 15, totalValue: 2847.50, icon: '☕', status: 'active', createdAt: '2023-01-15' },
    { id: 'CAT-002', name: 'Equipment', description: 'Brewing equipment and machines', productCount: 8, totalValue: 5432.80, icon: '⚙️', status: 'active', createdAt: '2023-01-15' },
    { id: 'CAT-003', name: 'Accessories', description: 'Mugs, filters, and other accessories', productCount: 23, totalValue: 1256.40, icon: '🧰', status: 'active', createdAt: '2023-01-20' },
    { id: 'CAT-004', name: 'Tea', description: 'Various tea products', productCount: 12, totalValue: 945.60, icon: '🍵', status: 'active', createdAt: '2023-02-01' },
    { id: 'CAT-005', name: 'Syrups & Flavors', description: 'Flavoring syrups and additives', productCount: 18, totalValue: 567.30, icon: '🍯', status: 'active', createdAt: '2023-03-10' },
    { id: 'CAT-006', name: 'Seasonal', description: 'Seasonal and limited items', productCount: 0, totalValue: 0, icon: '🎃', status: 'inactive', createdAt: '2023-10-01' },
  ]);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);
  const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);
  const activeCategories = categories.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Category Manager</h1>
          <button
            onClick={() => setShowNewCategory(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            + New Category
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Categories" value={categories.length} icon="📁" />
          <StatCard title="Active Categories" value={activeCategories} icon="✅" />
          <StatCard title="Total Products" value={totalProducts} icon="📦" />
          <StatCard title="Total Value" value={`$${totalValue.toFixed(2)}`} icon="💰" />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-slate-800 rounded-lg p-6 hover:ring-2 ring-blue-500 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-3xl">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{category.name}</h3>
                    <p className="text-xs text-slate-400">{category.id}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  category.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'
                }`}>
                  {category.status}
                </span>
              </div>

              <p className="text-sm text-slate-400 mb-4">{category.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Products</div>
                  <div className="text-xl font-bold text-blue-400">{category.productCount}</div>
                </div>
                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Total Value</div>
                  <div className="text-xl font-bold text-green-400">${category.totalValue.toFixed(0)}</div>
                </div>
              </div>

              <div className="text-xs text-slate-400 mb-4">
                Created: {new Date(category.createdAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCategory(category.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                >
                  Edit
                </button>
                <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium">
                  View Products
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* New Category Modal */}
        {showNewCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-6">Create New Category</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Category Name</label>
                    <input type="text" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="e.g., Pastries" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Icon (Emoji)</label>
                    <input type="text" className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" placeholder="🥐" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Description</label>
                  <textarea className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg resize-none" rows={3} placeholder="Brief description of this category"></textarea>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Status</label>
                  <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                  Create Category
                </button>
                <button
                  onClick={() => setShowNewCategory(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {editingCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-6">Edit Category</h2>
              <div className="space-y-4">
                {(() => {
                  const cat = categories.find(c => c.id === editingCategory);
                  if (!cat) return null;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Category Name</label>
                          <input type="text" defaultValue={cat.name} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Icon (Emoji)</label>
                          <input type="text" defaultValue={cat.icon} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Description</label>
                        <textarea defaultValue={cat.description} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg resize-none" rows={3}></textarea>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Status</label>
                        <select defaultValue={cat.status} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
                  Save Changes
                </button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium">
                  Delete
                </button>
                <button
                  onClick={() => setEditingCategory(null)}
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
