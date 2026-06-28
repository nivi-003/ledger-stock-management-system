import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { toast } from 'react-toastify';

const ProductModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [currentQuantity, setCurrentQuantity] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(product.category || 'General');
      setSku(product.sku || '');
      setUnit(product.unit || 'Pcs');
      setCurrentQuantity(product.currentQuantity?.toString() || '0');
    } else {
      setName('');
      setCategory('General');
      setSku('');
      setUnit('Pcs');
      setCurrentQuantity('0');
    }
  }, [product, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name,
        category,
        sku,
        unit,
        // Backend still needs these — set to 0 as placeholder (not displayed in UI)
        purchasePrice: product?.purchasePrice ?? 0,
        sellingPrice: product?.sellingPrice ?? 0,
        currentQuantity: product ? undefined : Number(currentQuantity) || 0,
      };

      if (product) {
        const { currentQuantity: _cq, ...editPayload } = payload;
        await api.put(`/products/${product._id}`, editPayload);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created successfully!');
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
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Product Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Basmati Rice 25kg"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Grains, Flour"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">SKU Code</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. RICE-BAS-25"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. Bags, Pcs, Kg"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {!product && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Opening Stock</label>
              <input
                type="number"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value)}
                placeholder="e.g. 10"
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
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
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-semibold shadow-md shadow-emerald-100 transition-all"
          >
            {submitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;
