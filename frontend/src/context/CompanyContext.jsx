import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/companies');
      setCompanies(res.data);
      
      if (res.data.length > 0) {
        const storedId = localStorage.getItem('activeCompanyId');
        const found = res.data.find(c => c._id === storedId);
        
        if (found) {
          setActiveCompany(found);
        } else {
          // Default to the first company if none is stored or the stored one is deleted
          setActiveCompany(res.data[0]);
          localStorage.setItem('activeCompanyId', res.data[0]._id);
        }
      } else {
        setActiveCompany(null);
        localStorage.removeItem('activeCompanyId');
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const changeActiveCompany = (companyId) => {
    const selected = companies.find(c => c._id === companyId);
    if (selected) {
      setActiveCompany(selected);
      localStorage.setItem('activeCompanyId', selected._id);
      // Trigger full page reload to reset all hooks and context scopes cleanly
      window.location.reload();
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        loading,
        fetchCompanies,
        changeActiveCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
export default CompanyContext;
