import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { toast } from 'react-toastify';

const TransactionModal = ({ isOpen, onClose, transaction, onSuccess, preselectedAccountId }) => {
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  
  const [accountId, setAccountId] = useState(preselectedAccountId || '');
  const [type, setType] = useState('Receipt'); // Receipt or Payment
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load Accounts for selection
  useEffect(() => {
    if (isOpen) {
      const fetchAccountsForSelect = async () => {
        try {
          setLoadingAccounts(true);
          // Fetch ledger accounts excluding cash/bank since they are automatically affected as part of the double entry!
          const res = await api.get('/accounts');
          // Filter to show customers, suppliers, expenses, and others
          const filtered = res.data.filter(
            (acc) => acc.type !== 'Cash' && acc.type !== 'Bank'
          );
          setAccounts(filtered);
          
          if (filtered.length > 0 && !transaction) {
            setAccountId(preselectedAccountId || filtered[0]._id);
          }
        } catch (error) {
          toast.error('Failed to load accounts for selection');
        } finally {
          setLoadingAccounts(false);
        }
      };
      
      fetchAccountsForSelect();
    }
  }, [isOpen, transaction, preselectedAccountId]);

  // Set initial form states for edit
  useEffect(() => {
    if (transaction) {
      setAccountId(transaction.accountId?._id || transaction.accountId || '');
      setType(transaction.type || 'Receipt');
      setAmount(transaction.amount?.toString() || '');
      setDate(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setPaymentMode(transaction.paymentMode || 'Cash');
      setNotes(transaction.notes || '');
      setReferenceNumber(transaction.referenceNumber || '');
    } else {
      setType('Receipt');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('Cash');
      setNotes('');
      setReferenceNumber('');
      if (preselectedAccountId) {
        setAccountId(preselectedAccountId);
      }
    }
  }, [transaction, isOpen, preselectedAccountId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId) {
      toast.error('Please select an account');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        accountId,
        type,
        amount: Number(amount),
        date: new Date(date),
        paymentMode,
        notes,
        referenceNumber,
      };

      if (transaction) {
        await api.put(`/transactions/${transaction._id}`, payload);
        toast.success('Transaction updated successfully!');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction registered successfully!');
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
    <Modal isOpen={isOpen} onClose={onClose} title={transaction ? 'Edit Transaction' : 'Add Transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Button Segmented Control for Transaction Type */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setType('Receipt')}
            className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${
              type === 'Receipt'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Receipt (Cash In / Cr)
          </button>
          <button
            type="button"
            onClick={() => setType('Payment')}
            className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${
              type === 'Payment'
                ? 'bg-rose-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment (Cash Out / Dr)
          </button>
        </div>

        {/* Account Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ledger Account *</label>
          {loadingAccounts ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-xl"></div>
          ) : (
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {accounts.length === 0 ? (
                <option value="">No ledger accounts found</option>
              ) : (
                accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({acc.type})
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount (₹) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
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

        {/* Payment Mode & Ref */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Mode *</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Debit/Credit Card</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reference Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UPI Transaction ID"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add brief details about this transaction..."
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
              type === 'Receipt'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
            }`}
          >
            <span>{submitting ? 'Saving...' : 'Save Transaction'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionModal;
