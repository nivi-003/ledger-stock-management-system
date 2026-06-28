import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiArrowDown, FiArrowUp, FiTruck } from 'react-icons/fi';
import api from '../services/api';
import { useCompany } from '../context/CompanyContext';
import StockEntryModal from '../components/StockEntryModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const StockEntry = () => {
  const { activeCompany } = useCompany();

  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState('');
  const [filterType, setFilterType] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchStockEntries = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      let url = '/stock-entries?';
      if (productId) url += `&productId=${productId}`;
      if (filterType) url += `&type=${filterType}`;
      const res = await api.get(url);
      setEntries(res.data);
    } catch (error) {
      toast.error('Failed to load stock entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!activeCompany) return;
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Failed to load products', error);
    }
  };

  useEffect(() => { fetchStockEntries(); }, [activeCompany, productId, filterType]);
  useEffect(() => { fetchProducts(); }, [activeCompany]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/stock-entries/${deleteTarget._id}`);
      toast.success('Stock entry deleted and inventory updated');
      fetchStockEntries();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message || 'Deletion failed');
    }
  };

  const totalIn = entries.filter(e => e.type === 'Stock In').reduce((s, e) => s + e.quantity, 0);
  const totalOut = entries.filter(e => e.type === 'Stock Out').reduce((s, e) => s + e.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Stock Entry</h2>
          <p className="text-sm text-gray-500">Log stock additions (Stock In) and deductions (Stock Out).</p>
        </div>
        <button
          onClick={() => { setSelectedEntry(null); setModalOpen(true); }}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-100 transition-all text-sm"
        >
          <FiPlus />
          <span>New Entry</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Stock In</p>
            <h3 className="text-lg font-bold text-emerald-600 mt-1">{totalIn} Units</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <FiArrowDown className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Stock Out</p>
            <h3 className="text-lg font-bold text-rose-600 mt-1">{totalOut} Units</h3>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <FiArrowUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/85 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-grow max-w-md">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- All Products --</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-1.5">
          {[{ label: 'All', value: '' }, { label: 'Stock In', value: 'Stock In' }, { label: 'Stock Out', value: 'Stock Out' }].map((item) => (
            <button
              key={item.label}
              onClick={() => setFilterType(item.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterType === item.value
                  ? 'bg-emerald-600 text-white shadow shadow-emerald-100'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading stock entries..." />
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <FiTruck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Stock Entries Found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-1 text-sm">Add a Stock In or Stock Out entry to adjust inventory.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Movement Type</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-700 text-sm">{entry.productId?.name || 'Deleted Product'}</p>
                      {entry.productId?.sku && (
                        <span className="text-xs text-gray-400 font-medium block mt-0.5">SKU: {entry.productId.sku}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {entry.type === 'Stock In' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                          <FiArrowDown className="w-3.5 h-3.5" />
                          <span>Stock In</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                          <FiArrowUp className="w-3.5 h-3.5" />
                          <span>Stock Out</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${entry.type === 'Stock In' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {entry.type === 'Stock In' ? '+' : '-'}{entry.quantity} {entry.unit || entry.productId?.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 font-medium">
                      {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => { setSelectedEntry(entry); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 rounded transition-colors">
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(entry)} className="p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors">
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

      <StockEntryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedEntry(null); }}
        stockEntry={selectedEntry}
        onSuccess={fetchStockEntries}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Stock Entry?"
        message="This will revert the product's stock count. Stock In deletions that cause negative stock will be blocked by the server."
      />
    </div>
  );
};

export default StockEntry;
