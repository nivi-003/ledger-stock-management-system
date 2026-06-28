import React, { useState, useEffect } from 'react';
import { FiFilter, FiCalendar, FiPrinter, FiDownload, FiBarChart2, FiBookOpen, FiPackage, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import api from '../services/api';
import { useCompany } from '../context/CompanyContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const Reports = () => {
  const { activeCompany } = useCompany();

  const [activeTab, setActiveTab] = useState('Summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);

  const [summaryData, setSummaryData] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!activeCompany) return;
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (error) {
      console.error('Failed to load accounts', error);
    }
  };

  useEffect(() => { fetchAccounts(); }, [activeCompany]);

  const fetchReportData = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      let query = '';
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;
      if (accountId) query += `&accountId=${accountId}`;

      if (activeTab === 'Summary') {
        const res = await api.get(`/reports/summary?${query}`);
        setSummaryData(res.data);
      } else if (activeTab === 'Ledger') {
        const res = await api.get(`/reports/ledger?${query}`);
        // Filter by account if selected
        let data = res.data;
        if (accountId) data = data.filter(a => a._id === accountId);
        setLedgerData(data);
      } else if (activeTab === 'Inventory') {
        const res = await api.get(`/reports/inventory?${query}`);
        setInventoryData(res.data);
      }
    } catch (error) {
      toast.error(`Failed to load ${activeTab} report`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReportData(); }, [activeCompany, activeTab, startDate, endDate, accountId]);

  const handleExportCSV = () => {
    let csvContent = '';
    let fileName = '';

    if (activeTab === 'Summary' && summaryData) {
      fileName = 'financial_summary_report.csv';
      const rows = [
        ['Financial Summary Report', activeCompany.name],
        ['Period', `${startDate || 'Start'} to ${endDate || 'End'}`],
        [],
        ['Metric', 'Amount (INR)'],
        ['Total Sales', summaryData.totalSales],
        ['Total Purchases', summaryData.totalPurchases],
        ['Total Receipts', summaryData.totalReceipts],
        ['Total Payments', summaryData.totalPayments],
        ['Total Expenses', summaryData.totalExpenses],
        ['Net Profit', summaryData.netProfit],
      ];
      csvContent = rows.map(r => r.join(',')).join('\n');
    } else if (activeTab === 'Ledger') {
      fileName = 'ledger_report.csv';
      const headers = ['Account Name', 'Type', 'Opening Balance', 'Receipts', 'Payments', 'Closing Balance'];
      const rows = ledgerData.map(acc => [`"${acc.name}"`, acc.type, acc.openingBalance, acc.totalReceipts, acc.totalPayments, acc.closingBalance]);
      csvContent = [['Ledger Report', activeCompany.name], [], headers, ...rows].map(r => r.join(',')).join('\n');
    } else if (activeTab === 'Inventory') {
      fileName = 'inventory_report.csv';
      const headers = ['Product', 'Category', 'Stock In', 'Stock Out', 'Current Stock'];
      const rows = inventoryData.map(p => [`"${p.name}"`, p.category, p.stockIn, p.stockOut, p.currentStock]);
      csvContent = [['Inventory Report', activeCompany.name], [], headers, ...rows].map(r => r.join(',')).join('\n');
    }

    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print-full-width">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Reports</h2>
          <p className="text-sm text-gray-500">Financial summaries, ledger balances, and inventory analysis.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 bg-white rounded-xl text-xs font-bold text-gray-600 transition-colors shadow-sm"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-100"
          >
            <FiPrinter className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">{activeCompany?.name}</h1>
        <p className="text-sm text-gray-500">{activeCompany?.address}</p>
        <div className="flex justify-between mt-3 pt-2 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-700">{activeTab} Report</span>
          <span className="text-xs text-gray-500">Period: {startDate || 'All Time'} to {endDate || 'Today'}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/85 shadow-sm no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Account Filter */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <FiFilter className="text-gray-400 shrink-0" />
            <div className="flex-grow min-w-0">
              <span className="text-gray-400 uppercase font-semibold block" style={{fontSize:'9px'}}>Account Filter</span>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none"
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* From Date */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <FiCalendar className="text-gray-400 shrink-0" />
            <div className="flex-grow">
              <span className="text-gray-400 uppercase font-semibold block" style={{fontSize:'9px'}}>From Date</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs w-full focus:outline-none" />
            </div>
          </div>

          {/* To Date */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <FiCalendar className="text-gray-400 shrink-0" />
            <div className="flex-grow">
              <span className="text-gray-400 uppercase font-semibold block" style={{fontSize:'9px'}}>To Date</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs w-full focus:outline-none" />
            </div>
          </div>

          {/* Clear */}
          <div className="flex items-center">
            {(startDate || endDate || accountId) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); setAccountId(''); }} className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl no-print">
        {[
          { id: 'Summary', name: 'Summary', icon: <FiBarChart2 className="w-4 h-4" /> },
          { id: 'Ledger', name: 'Ledger', icon: <FiBookOpen className="w-4 h-4" /> },
          { id: 'Inventory', name: 'Inventory', icon: <FiPackage className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-grow flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-emerald-700 shadow shadow-gray-200/50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {loading ? (
        <LoadingSpinner message={`Loading ${activeTab} report...`} />
      ) : (
        <div className="print-full-width">

          {/* SUMMARY TAB */}
          {activeTab === 'Summary' && summaryData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</span>
                  <h3 className="text-2xl font-extrabold text-gray-800 mt-2">₹{summaryData.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-gray-400 mt-1">Value of stock moved out</p>
                </div>
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><FiTrendingUp className="w-7 h-7" /></div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Purchases</span>
                  <h3 className="text-2xl font-extrabold text-gray-800 mt-2">₹{summaryData.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-gray-400 mt-1">Cost of stock added</p>
                </div>
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><FiTrendingDown className="w-7 h-7" /></div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Receipts</span>
                  <h3 className="text-2xl font-extrabold text-emerald-600 mt-2">₹{summaryData.totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-gray-400 mt-1">Credits collected</p>
                </div>
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><FiDollarSign className="w-7 h-7" /></div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Payments</span>
                  <h3 className="text-2xl font-extrabold text-rose-600 mt-2">₹{summaryData.totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-gray-400 mt-1">Debits cleared</p>
                </div>
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><FiDollarSign className="w-7 h-7" /></div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expenses</span>
                  <h3 className="text-2xl font-extrabold text-gray-800 mt-2">₹{summaryData.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-gray-400 mt-1">Operating costs paid</p>
                </div>
                <div className="p-4 bg-gray-50 text-gray-500 rounded-2xl"><FiBarChart2 className="w-7 h-7" /></div>
              </div>

              <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between ${summaryData.netProfit >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Profit</span>
                  <h3 className={`text-2xl font-black mt-2 ${summaryData.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ₹{summaryData.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Sales - Purchases - Expenses</p>
                </div>
                <div className={`p-4 rounded-2xl ${summaryData.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  <FiTrendingUp className="w-7 h-7" />
                </div>
              </div>
            </div>
          )}

          {/* LEDGER TAB */}
          {activeTab === 'Ledger' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              {ledgerData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No ledger data found for the selected filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Account Name</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Opening Balance</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Receipts</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Payments</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ledgerData.map((acc) => (
                        <tr key={acc._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4 font-bold text-gray-700 text-sm">{acc.name}</td>
                          <td className="px-5 py-4 text-xs text-gray-500 font-semibold">{acc.type}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-gray-600 text-right">₹{acc.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-emerald-600 text-right">₹{acc.totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-rose-600 text-right">₹{acc.totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-5 py-4 text-sm font-extrabold text-gray-800 text-right">
                            ₹{acc.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ml-1.5 ${
                              acc.type === 'Customer' ? (acc.closingBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600')
                              : acc.type === 'Supplier' ? (acc.closingBalance >= 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')
                              : acc.closingBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {acc.type === 'Customer' ? (acc.closingBalance >= 0 ? 'Rcv' : 'Adv')
                               : acc.type === 'Supplier' ? (acc.closingBalance >= 0 ? 'Pay' : 'Adv')
                               : acc.closingBalance >= 0 ? 'Dr' : 'Cr'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'Inventory' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              {inventoryData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No inventory data found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Stock In</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Stock Out</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Current Stock</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inventoryData.map((prod) => (
                        <tr key={prod._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-bold text-gray-700 text-sm">{prod.name}</p>
                            {prod.sku && <span className="text-xs text-gray-400 font-bold uppercase block mt-0.5">SKU: {prod.sku}</span>}
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500 font-semibold">{prod.category}</td>
                          <td className="px-5 py-4 text-xs font-bold text-emerald-600 text-center">+{prod.stockIn} {prod.unit}</td>
                          <td className="px-5 py-4 text-xs font-bold text-rose-600 text-center">-{prod.stockOut} {prod.unit}</td>
                          <td className="px-5 py-4 text-sm font-extrabold text-gray-700 text-center">{prod.currentStock} {prod.unit}</td>
                          <td className="px-5 py-4 text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${prod.isLowStock ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                              {prod.isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
