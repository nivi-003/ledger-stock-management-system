import React, { useState, useEffect } from 'react';
import { FiSettings, FiDatabase, FiLayers, FiInfo, FiDownload, FiUpload, FiSave } from 'react-icons/fi';
import api from '../services/api';
import { useCompany } from '../context/CompanyContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const Settings = () => {
  const { activeCompany } = useCompany();

  const [appName, setAppName] = useState('');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [summary, setSummary] = useState({ accountsCount: 0, transactionsCount: 0, productsCount: 0, stockEntriesCount: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchSettings = async () => {
    if (!activeCompany) return;
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setAppName(res.data.settings.appName || '');
      setTaxEnabled(res.data.settings.taxEnabled || false);
      setSummary(res.data.summary);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, [activeCompany]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/settings', { appName, taxEnabled });
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = () => {
    window.open('http://localhost:5001/api/settings/backup', '_blank');
    toast.success('Generating database backup...');
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm('WARNING: This will OVERWRITE all current data. Continue?')) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoring(true);
        const parsedData = JSON.parse(event.target.result);
        const res = await api.post('/settings/restore', parsedData);
        toast.success(res.data.message || 'Database restored!');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast.error('Restore failed: Invalid backup file');
      } finally {
        setRestoring(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (loading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Settings & More</h2>
        <p className="text-sm text-gray-500">Configure preferences and manage database utilities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          {/* Data Summary */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-2">
              <FiLayers />
              <span>Database Summary</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-emerald-50 p-3 rounded-xl">
                <span className="text-xs text-emerald-600 uppercase font-semibold block">Accounts</span>
                <p className="text-xl font-bold text-emerald-700">{summary.accountsCount}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <span className="text-xs text-blue-600 uppercase font-semibold block">Transactions</span>
                <p className="text-xl font-bold text-blue-700">{summary.transactionsCount}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl">
                <span className="text-xs text-amber-600 uppercase font-semibold block">Products</span>
                <p className="text-xl font-bold text-amber-700">{summary.productsCount}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl">
                <span className="text-xs text-purple-600 uppercase font-semibold block">Stock Logs</span>
                <p className="text-xl font-bold text-purple-700">{summary.stockEntriesCount}</p>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-2">
              <FiInfo />
              <span>About Application</span>
            </h3>
            <div className="text-xs text-gray-500 space-y-2 pt-1">
              <p><span className="font-semibold text-gray-700">App:</span> Ledger & Stock Management</p>
              <p><span className="font-semibold text-gray-700">Version:</span> 1.0.0</p>
              <p><span className="font-semibold text-gray-700">Stack:</span> MERN (MongoDB, Express, React, Node)</p>
              <p className="border-t border-gray-100 pt-2 text-emerald-600 font-medium">Licensed under MIT.</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Settings Form */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-2 border-b border-gray-100 pb-3 mb-4">
              <FiSettings />
              <span>Company Settings</span>
            </h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Application Title</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. Sri Lakshmi Ledger"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-gray-50 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span>Enable GST Tax Compliance</span>
                </label>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold shadow-md shadow-emerald-100 transition-all text-sm"
                >
                  <FiSave />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Backup & Restore */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-2 border-b border-gray-100 pb-3">
              <FiDatabase />
              <span>Data Management</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Backup */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <h4 className="text-sm font-bold text-gray-800">Export Backup</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Download a complete JSON snapshot of all companies, accounts, transactions, and inventory data.</p>
                <button
                  onClick={handleBackup}
                  className="flex items-center space-x-1.5 px-4 py-2 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 bg-white rounded-lg text-xs font-bold text-gray-600 shadow-sm transition-colors"
                >
                  <FiDownload />
                  <span>Backup Database</span>
                </button>
              </div>

              {/* Restore */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <h4 className="text-sm font-bold text-gray-800">Import Restore</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Upload a previously exported JSON backup to overwrite current database collections.</p>
                <div className="relative">
                  <input type="file" accept=".json" onChange={handleRestore} disabled={restoring} id="restore-file-input" className="hidden" />
                  <label
                    htmlFor="restore-file-input"
                    className={`flex items-center space-x-1.5 px-4 py-2 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 bg-white rounded-lg text-xs font-bold text-gray-600 shadow-sm cursor-pointer transition-colors w-max ${restoring ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <FiUpload />
                    <span>{restoring ? 'Restoring...' : 'Restore Database'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
