import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiBriefcase, FiUsers, FiDollarSign,
  FiBox, FiTruck, FiBarChart2, FiSettings,
  FiMenu, FiX, FiChevronDown, FiPlus
} from 'react-icons/fi';
import { useCompany } from '../context/CompanyContext';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: FiHome },
  { name: 'Companies', path: '/companies', icon: FiBriefcase },
  { name: 'Accounts', path: '/accounts', icon: FiUsers },
  { name: 'Transactions', path: '/transactions', icon: FiDollarSign },
  { name: 'Inventory', path: '/products', icon: FiBox },
  { name: 'Stock Entry', path: '/stock-entries', icon: FiTruck },
  { name: 'Reports', path: '/reports', icon: FiBarChart2 },
  { name: 'Settings', path: '/settings', icon: FiSettings },
];

const bottomMenuItems = [
  { name: 'Dashboard', path: '/', icon: FiHome },
  { name: 'Accounts', path: '/accounts', icon: FiUsers },
  { name: 'Txns', path: '/transactions', icon: FiDollarSign },
  { name: 'Inventory', path: '/products', icon: FiBox },
  { name: 'Reports', path: '/reports', icon: FiBarChart2 },
];

const Layout = ({ children }) => {
  const { companies, activeCompany, changeActiveCompany, loading } = useCompany();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const current = menuItems.find(item => item.path === location.pathname);
    if (current) return current.name;
    if (location.pathname.startsWith('/accounts/')) return 'Account Details';
    return 'Ledger & Stock';
  };

  const handleCompanyChange = (id) => {
    changeActiveCompany(id);
    setCompanyDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 md:flex-row pb-16 md:pb-0">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-200 shrink-0">
              L
            </div>
            <div>
              <p className="font-bold text-gray-800 text-base leading-tight">Ledger & Stock</p>
              <p className="text-xs text-gray-400 font-medium">Management System</p>
            </div>
          </div>
        </div>

        {/* Company Selector */}
        <div className="px-4 py-3 border-b border-gray-100">
          {loading ? (
            <div className="h-12 bg-gray-100 animate-pulse rounded-xl"></div>
          ) : activeCompany ? (
            <div className="relative">
              <button
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className="w-full flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-left hover:bg-emerald-100 transition-all focus:outline-none"
              >
                <div className="truncate pr-2 min-w-0">
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Active Company</p>
                  <p className="font-bold text-gray-800 text-sm truncate">{activeCompany.name}</p>
                </div>
                <FiChevronDown className={`w-4 h-4 text-emerald-600 shrink-0 transition-transform ${companyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {companyDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                  {companies.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => handleCompanyChange(c._id)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors first:rounded-t-xl ${
                        c._id === activeCompany._id ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 p-1">
                    <Link
                      to="/companies"
                      onClick={() => setCompanyDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg font-semibold transition-colors"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      <span>Manage Companies</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/companies"
              className="w-full flex items-center justify-center space-x-2 p-2.5 bg-emerald-50 border border-dashed border-emerald-300 rounded-xl text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-all"
            >
              <FiPlus />
              <span>Create Company</span>
            </Link>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center font-medium">v1.0.0 · Ledger & Stock Pro</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 py-3 flex items-center justify-between md:px-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-xl text-gray-600 hover:bg-gray-100 focus:outline-none md:hidden"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2.5 md:hidden">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">L</div>
            </div>
            <h1 className="text-base font-bold text-gray-800 tracking-tight hidden md:block">{getPageTitle()}</h1>
          </div>

          <div />
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="relative flex flex-col w-4/5 max-w-xs bg-white h-full shadow-2xl z-50 animate-slide-in">
              <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-600">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black">L</div>
                  <span className="font-bold text-white">Ledger & Stock</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg bg-emerald-700 text-white">
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {activeCompany && (
                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                  <p className="text-xs text-emerald-600 uppercase font-semibold">Active</p>
                  <p className="font-bold text-gray-800 text-sm truncate">{activeCompany.name}</p>
                  <p className="text-xs text-gray-400">FY: {activeCompany.financialYear}</p>
                </div>
              )}

              <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-colors ${
                        isActive ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {!loading && !activeCompany && location.pathname !== '/companies' ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <FiBriefcase className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Company</h2>
              <p className="text-gray-500 max-w-sm mb-6">Please create or select a company to start managing your ledger and stock.</p>
              <button
                onClick={() => navigate('/companies')}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md transition-all"
              >
                <FiPlus className="w-4 h-4" />
                <span>Manage Companies</span>
              </button>
            </div>
          ) : (
            children
          )}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-1 py-2 flex justify-around items-center z-40 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          {bottomMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-0.5 rounded-xl transition-all ${
                  isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-emerald-50' : ''}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs mt-0.5 font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
