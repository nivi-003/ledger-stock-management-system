import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';
import api from '../services/api';
import { useCompany } from '../context/CompanyContext';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const Transactions = () => {
  const { activeCompany } = useCompany();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTransactions = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      let url = `/transactions?search=${search}`;
      if (accountId) url += `&accountId=${accountId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await api.get(url);
      setTransactions(res.data);
    } catch (error) {
      toast.error('Failed to load transaction logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    if (!activeCompany) return;
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data.filter(a => a.type !== 'Cash' && a.type !== 'Bank'));
    } catch (error) {
      console.error('Failed to load accounts', error);
    }
  };

  useEffect(() => { fetchTransactions(); }, [activeCompany, search, accountId, startDate, endDate]);
  useEffect(() => { fetchAccounts(); }, [activeCompany]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/transactions/${deleteTarget._id}`);
      toast.success('Transaction deleted successfully');
      fetchTransactions();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message || 'Deletion failed');
    }
  };

  // Totals
  const totalReceipts = transactions.filter(t => t.type === 'Receipt').reduce((s, t) => s + t.amount, 0);
  const totalPayments = transactions.filter(t => t.type === 'Payment').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
          <p className="text-sm text-gray-500">Record receipts (credits) and payments (debits).</p>
        </div>
        <button
          onClick={() => { setSelectedTx(null); setModalOpen(true); }}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-100 transition-all text-sm"
        >
          <FiPlus />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Receipts</p>
            <h3 className="text-lg font-bold text-emerald-600 mt-1">
              ₹{totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <FiArrowDownLeft className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Payments</p>
            <h3 className="text-lg font-bold text-rose-600 mt-1">
              ₹{totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <FiArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/85 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account name..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- All Accounts --</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>{acc.name} ({acc.type})</option>
            ))}
          </select>
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <FiCalendar className="text-gray-400 shrink-0" />
            <div className="flex-grow">
              <span className="text-xs text-gray-400 uppercase font-semibold block" style={{fontSize:'9px'}}>From</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs w-full focus:outline-none" />
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <FiCalendar className="text-gray-400 shrink-0" />
            <div className="flex-grow">
              <span className="text-xs text-gray-400 uppercase font-semibold block" style={{fontSize:'9px'}}>To</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs w-full focus:outline-none" />
            </div>
          </div>
        </div>
        {(search || accountId || startDate || endDate) && (
          <div className="flex justify-end">
            <button onClick={() => { setSearch(''); setAccountId(''); setStartDate(''); setEndDate(''); }} className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading transactions..." />
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <FiArrowUpRight className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Transactions Found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-1 text-sm">Create a receipt or payment to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Account</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Mode</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-700 text-sm">{tx.accountId?.name || 'Deleted Account'}</p>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tx.accountId?.type}</span>
                        {tx.type === 'Receipt' ? (
                          <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-emerald-600">
                            <FiArrowDownLeft className="w-3 h-3" /><span>Receipt</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-rose-600">
                            <FiArrowUpRight className="w-3 h-3" /><span>Payment</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 font-medium">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-gray-600">{tx.paymentMode}</span>
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-bold text-right ${tx.type === 'Receipt' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => { setSelectedTx(tx); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 rounded transition-colors">
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(tx)} className="p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors">
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

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedTx(null); }}
        transaction={selectedTx}
        onSuccess={fetchTransactions}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Transaction?"
        message="Are you sure? This will adjust all associated balances."
      />
    </div>
  );
};

export default Transactions;
