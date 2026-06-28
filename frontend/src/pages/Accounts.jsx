import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiChevronRight, FiUsers } from 'react-icons/fi';
import api from '../services/api';
import { useCompany } from '../context/CompanyContext';
import AccountModal from '../components/AccountModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const Accounts = () => {
  const { activeCompany } = useCompany();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Customer, Supplier, Others (Cash, Bank, Expense, Other)
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAccounts = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      // Map frontend UI filter to API query parameters
      let apiType = 'All';
      if (filterType === 'Customers') apiType = 'Customer';
      else if (filterType === 'Suppliers') apiType = 'Supplier';
      
      let url = `/accounts?search=${search}`;
      if (apiType !== 'All') {
        url += `&type=${apiType}`;
      }

      const res = await api.get(url);
      
      // Client-side grouping for "Others" filter
      let data = res.data;
      if (filterType === 'Others') {
        data = data.filter(
          (acc) => acc.type !== 'Customer' && acc.type !== 'Supplier'
        );
      }
      
      setAccounts(data);
    } catch (error) {
      toast.error('Failed to load accounts ledger list');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [activeCompany, search, filterType]);

  const handleCreate = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  const handleEdit = (e, acc) => {
    e.stopPropagation(); // Prevent navigation to detail page
    setEditingAccount(acc);
    setModalOpen(true);
  };

  const handleDeleteTrigger = (e, acc) => {
    e.stopPropagation(); // Prevent navigation to detail page
    setDeleteTarget(acc);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/accounts/${deleteTarget._id}`);
      toast.success('Account and its transaction logs deleted successfully!');
      fetchAccounts();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  // Helper to format balance details
  const getBalanceDisplay = (acc) => {
    const bal = Math.abs(acc.balance);
    const formatted = `₹${bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    
    if (acc.type === 'Customer') {
      if (acc.balance > 0) return { text: formatted, label: 'Receivable', color: 'text-blue-600 bg-blue-50' };
      if (acc.balance < 0) return { text: formatted, label: 'Advance / Cr', color: 'text-emerald-600 bg-emerald-50' };
      return { text: formatted, label: 'Settled', color: 'text-gray-400 bg-gray-50' };
    }
    
    if (acc.type === 'Supplier') {
      if (acc.balance > 0) return { text: formatted, label: 'Payable', color: 'text-rose-600 bg-rose-50' };
      if (acc.balance < 0) return { text: formatted, label: 'Advance / Dr', color: 'text-emerald-600 bg-emerald-50' };
      return { text: formatted, label: 'Settled', color: 'text-gray-400 bg-gray-50' };
    }
    
    // Cash, Bank, Expense, Others
    if (acc.balance >= 0) return { text: formatted, label: 'Debit Bal', color: 'text-emerald-600 bg-emerald-50' };
    return { text: formatted, label: 'Credit Bal', color: 'text-rose-600 bg-rose-50' };
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Accounts Ledger</h2>
          <p className="text-sm text-gray-500">Manage customers, suppliers, expenses, and cash assets.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-100 transition-all text-sm"
        >
          <FiPlus />
          <span>New Account</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/85 shadow-sm">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <FiSearch className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search account name or phone number..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {['All', 'Customers', 'Suppliers', 'Others'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterType === tab
                  ? 'bg-emerald-600 text-white shadow shadow-emerald-100'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Account Ledger Cards List */}
      {loading ? (
        <LoadingSpinner message="Retrieving account cards..." />
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <FiUsers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Accounts Found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-1 text-sm">Create customer, supplier, or expense profiles under this active company.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const balDetails = getBalanceDisplay(acc);
            return (
              <div
                key={acc._id}
                onClick={() => navigate(`/accounts/${acc._id}`)}
                className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 p-5 cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Name and Type Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm truncate max-w-[180px]">{acc.name}</h3>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-semibold mt-1 inline-block">
                        {acc.type}
                      </span>
                    </div>
                    <div className="p-1 rounded-full text-gray-300 hover:bg-gray-50 hover:text-gray-500 transition-colors">
                      <FiChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Contact Number */}
                  {acc.phoneNumber && (
                    <p className="flex items-center space-x-2 text-xs text-gray-500 mt-3 font-semibold">
                      <FiPhone className="text-gray-400" />
                      <span>{acc.phoneNumber}</span>
                    </p>
                  )}
                </div>

                {/* Card Bottom: Balance & Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4">
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Running Balance</p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-sm font-bold text-gray-800">{balDetails.text}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${balDetails.color}`}>
                        {balDetails.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleEdit(e, acc)}
                      className="p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
                      title="Edit Account"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    {/* System default cash/bank cannot be deleted */}
                    {!( (acc.name === 'Cash in Hand' && acc.type === 'Cash') || 
                       (acc.name === 'Main Bank Account' && acc.type === 'Bank') ) && (
                      <button
                        onClick={(e) => handleDeleteTrigger(e, acc)}
                        className="p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete Account"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        account={editingAccount}
        onSuccess={fetchAccounts}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Ledger Account?"
        message={`Warning: Deleting account "${deleteTarget?.name}" will also delete all associated ledger receipts and payments logs. This will affect cash in hand and company balance aggregates.`}
      />
    </div>
  );
};

export default Accounts;
