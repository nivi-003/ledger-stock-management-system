import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiPackage,
  FiPlus, FiArrowUpRight, FiArrowDownLeft, FiClock, FiFileText
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { useCompany } from '../context/CompanyContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

// Shared modals
import TransactionModal from '../components/TransactionModal';
import AccountModal from '../components/AccountModal';
import ProductModal from '../components/ProductModal';
import StockEntryModal from '../components/StockEntryModal';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

const Dashboard = () => {
  const { activeCompany, loading: companyLoading } = useCompany();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Modal open states
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeCompany]);

  if (companyLoading || (loading && !data)) {
    return <LoadingSpinner message="Calculating figures..." />;
  }

  if (!activeCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome!</h2>
        <p className="text-gray-500 max-w-sm mb-6">Please set up a company to begin using the Ledger & Stock Management system.</p>
        <button 
          onClick={() => navigate('/companies')}
          className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold shadow-md"
        >
          <FiPlus />
          <span>Add Company</span>
        </button>
      </div>
    );
  }

  const { summary, recentTransactions, charts } = data || {
    summary: { cashInHand: 0, receivables: 0, payables: 0, inventoryValue: 0 },
    recentTransactions: [],
    charts: { incomeExpense: [], inventoryOverview: [] }
  };

  // Quick Action Buttons
  const quickActions = [
    { name: 'Add Transaction', icon: <FiDollarSign className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', action: () => setTxModalOpen(true) },
    { name: 'Add Account', icon: <FiPlus className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', action: () => setAccountModalOpen(true) },
    { name: 'Add Product', icon: <FiPackage className="w-5 h-5" />, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', action: () => setProductModalOpen(true) },
    { name: 'Stock Entry', icon: <FiFileText className="w-5 h-5" />, color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', action: () => setStockModalOpen(true) },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between text-white">
        <div>
          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">Active Company</p>
          <h2 className="text-xl font-bold">{activeCompany.name}</h2>
          <p className="text-emerald-200 text-sm mt-1">Financial Year: <span className="font-semibold text-white">{activeCompany.financialYear}</span></p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-white text-sm font-semibold backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          <span>Live Ledger Database</span>
        </div>
      </div>

      {/* --- DASHBOARD SUMMARY CARD METRICS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash in Hand */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cash & Bank Balance</span>
            <h3 className="text-lg md:text-2xl font-bold text-gray-800 mt-2">₹{summary.cashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">Liquid Assets</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <FiDollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Receivables (To Collect)</span>
            <h3 className="text-lg md:text-2xl font-bold text-gray-800 mt-2">₹{summary.receivables.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">Customer Dues</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Payables */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payables (To Pay)</span>
            <h3 className="text-lg md:text-2xl font-bold text-gray-800 mt-2">₹{summary.payables.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">Supplier Dues</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <FiTrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventory Value</span>
            <h3 className="text-lg md:text-2xl font-bold text-gray-800 mt-2">₹{summary.inventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-semibold mt-2 inline-block">At Cost Price</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <FiPackage className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- QUICK ACTION BUTTONS --- */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Accounting Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((act) => (
            <button
              key={act.name}
              onClick={act.action}
              className={`flex items-center space-x-3 p-3 rounded-xl border border-transparent font-semibold transition-all duration-200 ${act.color}`}
            >
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                {act.icon}
              </div>
              <span className="text-xs md:text-sm">{act.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- CHARTS ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cash Flow (Receipts vs Payments)</h4>
            <span className="text-[10px] text-gray-400 font-semibold">Last 6 Months</span>
          </div>
          <div className="h-64">
            {charts.incomeExpense.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No transaction records to display.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.incomeExpense} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                    formatter={(val) => [`₹${val.toLocaleString()}`, '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 500 }} />
                  <Bar dataKey="income" name="Receipts" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Payments" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Inventory Category Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inventory Categories Valuation</h4>
          </div>
          <div className="h-64">
            {charts.inventoryOverview.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No products in inventory.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.inventoryOverview}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.inventoryOverview.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString()}`, 'Value']} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 10, pt: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* --- RECENT TRANSACTIONS TABLE --- */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiClock className="text-gray-400" />
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Transactions</h4>
          </div>
          <Link to="/transactions" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-0.5">
            <span>View All Ledger Logs</span>
            <FiPlus className="w-3 h-3 rotate-45" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No transactions logged yet. Click "Add Transaction" to begin.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider">Account</th>
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider">Payment Mode</th>
                  <th className="px-5 py-3 text-xxs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-700 text-sm truncate max-w-[150px] md:max-w-xs">{tx.accountId?.name || 'N/A'}</p>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1 py-0.2 rounded mt-0.5 inline-block">{tx.accountId?.type}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {tx.type === 'Receipt' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                          <FiArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
                          <FiArrowUpRight className="w-3.5 h-3.5" />
                          <span>Payment</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 font-medium">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 font-semibold">{tx.paymentMode}</td>
                    <td className={`px-5 py-3.5 text-sm font-bold text-right ${tx.type === 'Receipt' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- FORM MODALS HANDLERS --- */}
      <TransactionModal 
        isOpen={txModalOpen} 
        onClose={() => setTxModalOpen(false)} 
        onSuccess={fetchDashboardData} 
      />
      <AccountModal 
        isOpen={accountModalOpen} 
        onClose={() => setAccountModalOpen(false)} 
        onSuccess={fetchDashboardData} 
      />
      <ProductModal 
        isOpen={productModalOpen} 
        onClose={() => setProductModalOpen(false)} 
        onSuccess={fetchDashboardData} 
      />
      <StockEntryModal 
        isOpen={stockModalOpen} 
        onClose={() => setStockModalOpen(false)} 
        onSuccess={fetchDashboardData} 
      />
    </div>
  );
};

export default Dashboard;
