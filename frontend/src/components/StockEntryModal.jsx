import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { toast } from 'react-toastify';

const StockEntryModal = ({ isOpen, onClose, stockEntry, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [productId, setProductId] = useState('');
  const [type, setType] = useState('Stock In');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load products list for dropdown
  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        try {
          setLoadingProducts(true);
          const res = await api.get('/products');
          setProducts(res.data);
          if (res.data.length > 0 && !stockEntry) {
            setProductId(res.data[0]._id);
            setUnit(res.data[0].unit || 'Pcs');
          }
        } catch (error) {
          toast.error('Failed to load products list');
        } finally {
          setLoadingProducts(false);
        }
      };

      const fetchAccounts = async () => {
        try {
          setLoadingAccounts(true);
          const res = await api.get('/accounts');
          // Filter to only display Customer or Supplier accounts
          const contactAccounts = res.data.filter(
            (acc) => acc.type === 'Customer' || acc.type === 'Supplier'
          );
          setAccounts(contactAccounts);
        } catch (error) {
          toast.error('Failed to load accounts list');
        } finally {
          setLoadingAccounts(false);
        }
      };

      fetchProducts();
      fetchAccounts();
    }
  }, [isOpen, stockEntry]);

  // Sync unit when product selection changes
  const handleProductChange = (id) => {
    setProductId(id);
    const selected = products.find((p) => p._id === id);
    if (selected) {
      setUnit(selected.unit || 'Pcs');
    }
  };

  // Sync initial edit values
  useEffect(() => {
    if (stockEntry) {
      setProductId(stockEntry.productId?._id || stockEntry.productId || '');
      setType(stockEntry.type || 'Stock In');
      setQuantity(stockEntry.quantity?.toString() || '');
      setUnit(stockEntry.unit || 'Pcs');
      setDate(stockEntry.date ? new Date(stockEntry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setAccountId(stockEntry.accountId?._id || stockEntry.accountId || '');
      setNotes(stockEntry.notes || '');
    } else {
      setType('Stock In');
      setQuantity('');
      setDate(new Date().toISOString().split('T')[0]);
      setAccountId('');
      setNotes('');
    }
  }, [stockEntry, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Please select a product');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        productId,
        type,
        quantity: Number(quantity),
        unit,
        date: new Date(date),
        accountId: accountId || null,
        notes,
      };

      if (stockEntry) {
        await api.put(`/stock-entries/${stockEntry._id}`, payload);
        toast.success('Stock entry updated successfully!');
      } else {
        await api.post('/stock-entries', payload);
        toast.success('Stock entry created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={stockEntry ? 'Edit Stock Entry' : 'New Stock Entry'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Button Segmented Control for Stock Type */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setType('Stock In')}
            className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${
              type === 'Stock In'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Stock In (Purchase/Add)
          </button>
          <button
            type="button"
            onClick={() => setType('Stock Out')}
            className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${
              type === 'Stock Out'
                ? 'bg-rose-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Stock Out (Sale/Reduce)
          </button>
        </div>

        {/* Product Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Product *</label>
          {loadingProducts ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-xl"></div>
          ) : (
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {products.length === 0 ? (
                <option value="">No products found</option>
              ) : (
                products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (SKU: {p.sku || 'N/A'}, Avail: {p.currentQuantity} {p.unit})
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* Quantity & Unit & Date */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Quantity *</label>
            <div className="relative">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <span className="absolute right-3 top-3 text-xs font-bold text-gray-400">{unit}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Associated Account */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Supplier / Customer Account <span className="text-[10px] text-gray-400">(Optional)</span>
          </label>
          {loadingAccounts ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-xl"></div>
          ) : (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- No Account --</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add warehouse, delivery, or tracking details..."
            rows="2"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-5 py-2.5 text-white rounded-xl font-semibold shadow-md transition-all flex items-center space-x-1 ${
              type === 'Stock In'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
            }`}
          >
            <span>{submitting ? 'Saving...' : 'Save Stock Entry'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockEntryModal;
