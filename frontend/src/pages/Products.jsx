import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, FiList, FiArrowDown, FiArrowUp, FiClock } from 'react-icons/fi';
import api from '../services/api';
import { useCompany } from '../context/CompanyContext';
import ProductModal from '../components/ProductModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const Products = () => {
  const { activeCompany } = useCompany();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const [historyTarget, setHistoryTarget] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchProducts = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      let url = `/products?search=${search}`;
      if (category) url += `&category=${category}`;
      const res = await api.get(url);
      setProducts(res.data);
    } catch (error) {
      toast.error('Failed to load products inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeCompany, search, category]);

  const handleCreate = () => { setEditingProduct(null); setModalOpen(true); };
  const handleEdit = (e, prod) => { e.stopPropagation(); setEditingProduct(prod); setModalOpen(true); };
  const handleDeleteTrigger = (e, prod) => { e.stopPropagation(); setDeleteTarget(prod); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget._id}`);
      toast.success('Product deleted successfully!');
      fetchProducts();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message || 'Deletion failed');
    }
  };

  const handleViewHistory = async (prod) => {
    try {
      setHistoryTarget(prod);
      setProductHistory([]);
      setLoadingHistory(true);
      const res = await api.get(`/products/${prod._id}`);
      setProductHistory(res.data.history);
    } catch (error) {
      toast.error('Failed to retrieve stock history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Inventory Products</h2>
          <p className="text-sm text-gray-500">Manage your product catalog and track stock levels.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-100 transition-all text-sm"
        >
          <FiPlus />
          <span>New Product</span>
        </button>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 border border-gray-200/80 shadow-sm rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Products</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{products.length} Items</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FiList className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 border border-gray-200/80 shadow-sm rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Stock Units</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {products.reduce((s, p) => s + Math.max(0, p.currentQuantity), 0)} Units
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FiPackage className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/85 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-grow">
          <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name, SKU, or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 md:w-48"
        >
          <option value="">-- All Categories --</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products List */}
      {loading ? (
        <LoadingSpinner message="Loading inventory..." />
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <FiPackage className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Products Found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-1 text-sm">Add a product to start tracking your inventory.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Stock Count</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((prod) => (
                  <tr
                    key={prod._id}
                    onClick={() => handleViewHistory(prod)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-700 text-sm">{prod.name}</p>
                      {prod.sku && (
                        <span className="text-xs text-gray-400 font-medium block mt-0.5">SKU: {prod.sku}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 font-medium">{prod.category || 'General'}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                        prod.currentQuantity <= prod.minStockAlert && prod.minStockAlert > 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        <span>{prod.currentQuantity} {prod.unit}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={(e) => handleEdit(e, prod)}
                          className="p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 rounded transition-colors"
                          title="Edit product"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTrigger(e, prod)}
                          className="p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors"
                          title="Delete product"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      <Modal
        isOpen={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        title={historyTarget ? `Stock History: ${historyTarget.name}` : ''}
      >
        {loadingHistory ? (
          <LoadingSpinner message="Loading history..." />
        ) : productHistory.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">No stock movement records found.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500">Current Stock:</span>
              <span className="text-gray-800 font-bold">{historyTarget?.currentQuantity} {historyTarget?.unit}</span>
            </div>
            <div className="relative pl-6 border-l border-gray-100 space-y-4 py-2">
              {productHistory.map((log) => {
                const isIn = log.type === 'Stock In';
                return (
                  <div key={log._id} className="relative">
                    <span className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-white ${isIn ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                      {isIn ? <FiArrowDown className="w-2.5 h-2.5" /> : <FiArrowUp className="w-2.5 h-2.5" />}
                    </span>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">{isIn ? 'Stock In' : 'Stock Out'}</span>
                        <span className={`text-xs font-extrabold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIn ? '+' : '-'}{log.quantity} {log.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center space-x-1 font-semibold">
                          <FiClock className="w-3 h-3" />
                          <span>{new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </span>
                        {log.accountId && <span className="font-semibold text-gray-500">{log.accountId.name}</span>}
                      </div>
                      {log.notes && (
                        <p className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded mt-1.5 italic">"{log.notes}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      <ProductModal isOpen={modalOpen} onClose={() => setModalOpen(false)} product={editingProduct} onSuccess={fetchProducts} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all its stock movement history.`}
      />
    </div>
  );
};

export default Products;
