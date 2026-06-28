import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiPhone, FiMapPin,
  FiFileText, FiArrowUpRight, FiArrowDownLeft, FiDollarSign
} from 'react-icons/fi';
import api from '../services/api';
import { useCompany } from '../context/CompanyContext';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const AccountDetails = () => {
  const { id } = useParams();
  const { activeCompany } = useCompany();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals management
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAccountDetails = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const res = await api.get(`/accounts/${id}`);
      setAccount(res.data.account);
      setTransactions(res.data.transactions);
    } catch (error) {
      toast.error('Failed to load ledger account details');
      console.error(error);
      navigate('/accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountDetails();
  }, [activeCompany, id]);

  const handleEditTx = (tx) => {
    setSelectedTx(tx);
    setTxModalOpen(true);
  };

  const handleCreateTx = () => {
    setSelectedTx(null);
    setTxModalOpen(true);
  };

  const handleDeleteTx = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/transactions/${deleteTarget._id}`);
      toast.success('Transaction deleted and ledger balance updated!');
      fetchAccountDetails();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message || 'Deletion failed');
    }
  };

  if (loading && !account) {
    return <LoadingSpinner message="Gathering ledger entries..." />;
  }

  if (!account) return null;

  // Sum calculations
  const totalReceipts = transactions
    .filter(t => t.type === 'Receipt')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayments = transactions
    .filter(t => t.type === 'Payment')
    .reduce((sum, t) => sum + t.amount, 0);

  // Balance status coloring
  const getBalanceStatus = () => {
    const bal = Math.abs(account.balance);
    const formatted = `₹${bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    if (account.type === 'Customer') {
      if (account.balance > 0) return { text: formatted, label: 'Receivable', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' };
      if (account.balance < 0) return { text: formatted, label: 'Advance from Cust (Cr)', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
      return { text: formatted, label: 'Settled', color: 'text-gray-400', bg: 'bg-gray-50 border-gray-100' };
    }

    if (account.type === 'Supplier') {
      if (account.balance > 0) return { text: formatted, label: 'Payable', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' };
      if (account.balance < 0) return { text: formatted, label: 'Advance to Supp (Dr)', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
      return { text: formatted, label: 'Settled', color: 'text-gray-400', bg: 'bg-gray-50 border-gray-100' };
    }

    // Cash, Bank, Expense, Other
    if (account.balance >= 0) return { text: formatted, label: 'Debit Balance', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
    return { text: formatted, label: 'Credit Balance', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' };
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/accounts')}
            className="p-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl transition-all"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-800">{account.name}</h2>
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{account.type}</span>
            </div>
            <p className="text-xs text-gray-400 font-semibold">Ledger statement profile</p>
          </div>
        </div>

        {/* Record Transaction Button */}
        {account.type !== 'Cash' && account.type !== 'Bank' && (
          <button
            onClick={handleCreateTx}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-100 text-sm"
          >
            <FiPlus />
            <span>Record Transaction</span>
          </button>
        )}
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact/Bio Details */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-center space-y-3">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Account Contact Info</h4>
          {account.phoneNumber ? (
            <p className="flex items-center space-x-2 text-xs text-gray-600 font-semibold">
              <FiPhone className="text-gray-400 shrink-0" />
              <span>{account.phoneNumber}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">No phone registered</p>
          )}
          {account.address ? (
            <p className="flex items-start space-x-2 text-xs text-gray-600">
              <FiMapPin className="text-gray-400 shrink-0 mt-0.5" />
              <span>{account.address}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">No address registered</p>
          )}
          {account.gstNumber && (
            <p className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
              <span className="text-[9px] uppercase font-bold text-gray-400 bg-gray-100 px-1 rounded">GSTIN</span>
              <span>{account.gstNumber}</span>
            </p>
          )}
        </div>

        {/* Financial Aggregates Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm grid grid-cols-3 gap-3 text-center md:col-span-2">
          {/* Opening Balance */}
          <div className="flex flex-col justify-center border-r border-gray-100 py-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Opening Bal</span>
            <p className="text-sm md:text-base font-bold text-gray-800 mt-1">₹{account.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          {/* Receipts (Credit Sum) */}
          <div className="flex flex-col justify-center border-r border-gray-100 py-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Receipts</span>
            <p className="text-sm md:text-base font-bold text-emerald-600 mt-1">₹{totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          {/* Payments (Debit Sum) */}
          <div className="flex flex-col justify-center py-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Payments</span>
            <p className="text-sm md:text-base font-bold text-rose-600 mt-1">₹{totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Primary Balance Display Banner */}
      <div className={`p-5 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 ${balanceStatus.bg}`}>
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Closing running balance</span>
          <h3 className={`text-xl md:text-3xl font-extrabold mt-1 ${balanceStatus.color}`}>
            {balanceStatus.text}
          </h3>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-xl shadow-sm self-start md:self-auto bg-white border border-gray-100 ${balanceStatus.color}`}>
          {balanceStatus.label}
        </span>
      </div>

      {/* Ledger Transactions Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiFileText className="text-gray-400" />
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ledger Statement logs</h4>
          </div>
          <span className="text-xs text-gray-400 font-semibold">{transactions.length} Logs</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No transactions found for this account. Click "Record Transaction" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider">Payment Mode</th>
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider">Reference No / Notes</th>
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      {tx.type === 'Receipt' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                          <FiArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Receipt (Cr)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
                          <FiArrowUpRight className="w-3.5 h-3.5" />
                          <span>Payment (Dr)</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 font-semibold">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 font-bold">{tx.paymentMode}</td>
                    <td className="px-5 py-3.5 max-w-xs truncate">
                      {tx.referenceNumber && (
                        <p className="text-xs font-semibold text-gray-700 truncate">Ref: {tx.referenceNumber}</p>
                      )}
                      {tx.notes && (
                        <p className="text-xxs text-gray-400 truncate mt-0.5">{tx.notes}</p>
                      )}
                      {!tx.referenceNumber && !tx.notes && <span className="text-gray-300">-</span>}
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-bold text-right ${tx.type === 'Receipt' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right no-print">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleEditTx(tx)}
                          className="p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 rounded transition-colors"
                          title="Edit log"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tx)}
                          className="p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors"
                          title="Delete log"
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
        )}
      </div>

      {/* Record/Edit Transaction Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => {
          setTxModalOpen(false);
          setSelectedTx(null);
        }}
        transaction={selectedTx}
        preselectedAccountId={account._id}
        onSuccess={fetchAccountDetails}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTx}
        title="Delete Transaction Log?"
        message="Are you sure you want to delete this transaction from the ledger? This will automatically update and rebalance the account's closing balance and the company's cash flow calculations."
      />
    </div>
  );
};

export default AccountDetails;
