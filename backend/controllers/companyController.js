import Company from '../models/Company.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import StockEntry from '../models/StockEntry.js';
import Settings from '../models/Settings.js';

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
export const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({});
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Public
export const getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new company
// @route   POST /api/companies
// @access  Public
export const createCompany = async (req, res, next) => {
  try {
    const { name, address, phoneNumber, email, gstNumber, financialYear } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Company name is required');
    }

    const company = await Company.create({
      name,
      address,
      phoneNumber,
      email,
      gstNumber,
      financialYear,
    });

    // Create default settings for this company
    await Settings.create({
      companyId: company._id,
      appName: `${name} Ledger`,
    });

    // Create default Cash Account and Bank Account for this company
    await Account.create([
      {
        companyId: company._id,
        name: 'Cash in Hand',
        type: 'Cash',
        openingBalance: 0,
        balance: 0,
      },
      {
        companyId: company._id,
        name: 'Main Bank Account',
        type: 'Bank',
        openingBalance: 0,
        balance: 0,
      }
    ]);

    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a company
// @route   PUT /api/companies/:id
// @access  Public
export const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }

    const { name, address, phoneNumber, email, gstNumber, financialYear } = req.body;

    company.name = name || company.name;
    company.address = address !== undefined ? address : company.address;
    company.phoneNumber = phoneNumber !== undefined ? phoneNumber : company.phoneNumber;
    company.email = email !== undefined ? email : company.email;
    company.gstNumber = gstNumber !== undefined ? gstNumber : company.gstNumber;
    company.financialYear = financialYear || company.financialYear;

    const updatedCompany = await company.save();
    res.json(updatedCompany);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a company and all its related records
// @route   DELETE /api/companies/:id
// @access  Public
export const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }

    const companyId = company._id;

    // Perform cascade deletes of all tables related to this company
    await Company.findByIdAndDelete(companyId);
    await Account.deleteMany({ companyId });
    await Transaction.deleteMany({ companyId });
    await Product.deleteMany({ companyId });
    await StockEntry.deleteMany({ companyId });
    await Settings.deleteMany({ companyId });

    res.json({ message: 'Company and all associated ledger/stock data deleted successfully' });
  } catch (error) {
    next(error);
  }
};
