import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { CompanyProvider } from './context/CompanyContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Accounts from './pages/Accounts';
import AccountDetails from './pages/AccountDetails';
import Transactions from './pages/Transactions';
import Products from './pages/Products';
import StockEntry from './pages/StockEntry';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <CompanyProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/:id" element={<AccountDetails />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/products" element={<Products />} />
            <Route path="/stock-entries" element={<StockEntry />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
      <ToastContainer 
        position="bottom-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </CompanyProvider>
  );
}

export default App;
