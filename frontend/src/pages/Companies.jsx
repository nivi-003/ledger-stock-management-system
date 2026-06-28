import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone, FiMail, FiCheckCircle } from 'react-icons/fi';
import { useCompany } from '../context/CompanyContext';
import CompanyModal from '../components/CompanyModal';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../services/api';
import { toast } from 'react-toastify';

const Companies = () => {
  const { companies, activeCompany, changeActiveCompany, fetchCompanies } = useCompany();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleEdit = (comp) => {
    setEditingCompany(comp);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/companies/${deleteTarget._id}`);
      toast.success('Company and all its data deleted successfully!');
      
      // If we deleted the active company, clean local storage
      const activeId = localStorage.getItem('activeCompanyId');
      if (activeId === deleteTarget._id) {
        localStorage.removeItem('activeCompanyId');
      }

      await fetchCompanies();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete company');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Companies Registry</h2>
          <p className="text-sm text-gray-500">Select, create, or manage your business profiles.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="hidden md:flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-100 transition-all text-sm"
        >
          <FiPlus />
          <span>New Company</span>
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <FiPlus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">No Companies Found</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-2">Create your first business profile to set up ledgers and track stock.</p>
          <button 
            onClick={handleCreate}
            className="mt-6 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md"
          >
            Create Company Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map((comp) => {
            const isActive = activeCompany && activeCompany._id === comp._id;
            return (
              <div 
                key={comp._id}
                onClick={() => !isActive && changeActiveCompany(comp._id)}
                className={`bg-white rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md relative ${
                  isActive 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/10' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Active Indicator Header */}
                <div className="flex items-start justify-between">
                  <div className="truncate pr-4">
                    <h3 className="font-bold text-gray-800 text-base truncate">{comp.name}</h3>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-semibold mt-1 inline-block">FY: {comp.financialYear}</span>
                  </div>

                  {isActive ? (
                    <span className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        changeActiveCompany(comp._id);
                      }}
                      className="text-xs font-semibold text-gray-500 hover:text-emerald-600 border border-gray-200 hover:border-emerald-200 bg-gray-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Select
                    </button>
                  )}
                </div>

                {/* Company Details */}
                <div className="my-4 space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  {comp.address && (
                    <p className="flex items-center space-x-2">
                      <FiMapPin className="text-gray-400 shrink-0" />
                      <span className="truncate">{comp.address}</span>
                    </p>
                  )}
                  {comp.phoneNumber && (
                    <p className="flex items-center space-x-2">
                      <FiPhone className="text-gray-400 shrink-0" />
                      <span>{comp.phoneNumber}</span>
                    </p>
                  )}
                  {comp.email && (
                    <p className="flex items-center space-x-2">
                      <FiMail className="text-gray-400 shrink-0" />
                      <span className="truncate">{comp.email}</span>
                    </p>
                  )}
                  {comp.gstNumber && (
                    <p className="flex items-center space-x-2 font-semibold text-gray-600 mt-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1 rounded">GSTIN</span>
                      <span>{comp.gstNumber}</span>
                    </p>
                  )}
                </div>

                {/* Action Buttons Footer */}
                <div className="flex items-center justify-end space-x-2 border-t border-gray-100 pt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(comp);
                    }}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hover:text-gray-700 transition-colors"
                    title="Edit Profile"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(comp);
                    }}
                    className="p-2 text-gray-400 hover:bg-rose-50 rounded-lg hover:text-rose-600 transition-colors"
                    title="Delete Company"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Add Button placed at bottom */}
      <div className="pt-6 flex justify-center md:hidden">
        <button 
          onClick={handleCreate}
          className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-100"
        >
          <FiPlus />
          <span>Add New Company</span>
        </button>
      </div>

      {/* Company Modal */}
      <CompanyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        company={editingCompany}
        onSuccess={fetchCompanies}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Company profile?"
        message={`Warning: This action will permanently delete "${deleteTarget?.name}" and ALL its accounts, ledger transaction logs, products, stock entries, and configurations. This action is irreversible.`}
        confirmText="Yes, Cascade Delete Everything"
      />
    </div>
  );
};

export default Companies;
