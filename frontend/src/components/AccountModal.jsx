import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { toast } from 'react-toastify';

const AccountModal = ({ isOpen, onClose, account, onSuccess }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Customer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name || '');
      setType(account.type || 'Customer');
      setPhoneNumber(account.phoneNumber || '');
      setAddress(account.address || '');
      setGstNumber(account.gstNumber || '');
      setOpeningBalance(account.openingBalance?.toString() || '0');
    } else {
      setName('');
      setType('Customer');
      setPhoneNumber('');
      setAddress('');
      setGstNumber('');
      setOpeningBalance('0');
    }
  }, [account, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name,
        type,
        phoneNumber,
        address,
        gstNumber,
        openingBalance: Number(openingBalance) || 0,
      };

      if (account) {
        await api.put(`/accounts/${account._id}`, payload);
        toast.success('Account updated successfully!');
      } else {
        await api.post('/accounts', payload);
        toast.success('Account created successfully!');
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
    <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Edit Account' : 'Add New Account'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ram Enterprises or Office Rent"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={!!account && (account.type === 'Cash' || account.type === 'Bank')}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
            >
              <option value="Customer">Customer</option>
              <option value="Supplier">Supplier</option>
              <option value="Expense">Expense</option>
              <option value="Cash">Cash Account</option>
              <option value="Bank">Bank Account</option>
              <option value="Other">Other Account</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Opening Balance (₹)</label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +91 94440 12345"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">GST Number</label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="e.g. 33ABCDE1234F1Z1"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Account address details"
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
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-semibold shadow-md shadow-emerald-100 transition-all flex items-center space-x-1"
          >
            <span>{submitting ? 'Saving...' : 'Save Account'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountModal;
