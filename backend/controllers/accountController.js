import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

// Helper to recalculate running balance of an account
export const recalculateAccountBalance = async (accountId) => {
  const account = await Account.findById(accountId);
  if (!account) return;

  const transactions = await Transaction.find({ accountId });

  let paymentsSum = 0; // Debits
  let receiptsSum = 0; // Credits

  transactions.forEach((tx) => {
    if (tx.type === 'Payment') {
      paymentsSum += tx.amount;
    } else if (tx.type === 'Receipt') {
      receiptsSum += tx.amount;
    }
  });

  // Calculate balance based on account type
  let currentBalance = account.openingBalance;

  if (account.type === 'Customer') {
    // Customers are Assets (Receivables)
    // Debits (Payments to them / invoice charges) increase balance.
    // Credits (Receipts from them) decrease balance.
    currentBalance = account.openingBalance + paymentsSum - receiptsSum;
  } else if (account.type === 'Supplier') {
    // Suppliers are Liabilities (Payables)
    // Credits (Receipts from them / purchase credits) increase balance.
    // Debits (Payments to them) decrease balance.
    currentBalance = account.openingBalance + receiptsSum - paymentsSum;
  } else if (account.type === 'Cash' || account.type === 'Bank') {
    // Cash/Bank are Assets
    // Receipts (Credits in accounting, cash in) increase balance.
    // Payments (Debits in accounting, cash out) decrease balance.
    currentBalance = account.openingBalance + receiptsSum - paymentsSum;
  } else if (account.type === 'Expense') {
    // Expenses are Debits
    // Payments increase expense balance. Receipts reduce it.
    currentBalance = account.openingBalance + paymentsSum - receiptsSum;
  } else {
    // General fallback (Asset-like)
    currentBalance = account.openingBalance + paymentsSum - receiptsSum;
  }

  account.balance = currentBalance;
  await account.save();
};

// @desc    Get accounts of active company
// @route   GET /api/accounts
// @access  Public (Company Scoped)
export const getAccounts = async (req, res, next) => {
  try {
    const { type, search } = req.query;
    const companyId = req.companyId;

    const query = { companyId };

    // Apply type filter if provided and not 'All'
    if (type && type !== 'All') {
      query.type = type;
    }

    // Apply search filter (name or phone)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const accounts = await Account.find(query).sort({ name: 1 });
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get account details and its transaction history
// @route   GET /api/accounts/:id
// @access  Public (Company Scoped)
export const getAccountById = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const account = await Account.findOne({ _id: req.params.id, companyId });

    if (!account) {
      res.status(404);
      throw new Error('Account not found in active company');
    }

    // Fetch transactions sorted by date descending
    const transactions = await Transaction.find({ accountId: account._id }).sort({ date: -1 });

    res.json({
      account,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new account
// @route   POST /api/accounts
// @access  Public (Company Scoped)
export const createAccount = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { name, type, phoneNumber, address, gstNumber, openingBalance } = req.body;

    if (!name || !type) {
      res.status(400);
      throw new Error('Account name and type are required');
    }

    // Check for duplicate account name in same company
    const existing = await Account.findOne({ companyId, name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      res.status(400);
      throw new Error(`Account with name "${name}" already exists in this company`);
    }

    const oBalance = Number(openingBalance) || 0;

    const account = await Account.create({
      companyId,
      name,
      type,
      phoneNumber,
      address,
      gstNumber,
      openingBalance: oBalance,
      balance: oBalance, // Initially, balance is opening balance
    });

    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an account
// @route   PUT /api/accounts/:id
// @access  Public (Company Scoped)
export const updateAccount = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const account = await Account.findOne({ _id: req.params.id, companyId });

    if (!account) {
      res.status(404);
      throw new Error('Account not found in active company');
    }

    const { name, type, phoneNumber, address, gstNumber, openingBalance } = req.body;

    // Check if name is changing and causes duplicate
    if (name && name.toLowerCase() !== account.name.toLowerCase()) {
      const duplicate = await Account.findOne({ companyId, name: { $regex: `^${name}$`, $options: 'i' } });
      if (duplicate) {
        res.status(400);
        throw new Error(`Another account with name "${name}" already exists in this company`);
      }
    }

    // Standard cash/bank accounts type shouldn't change easily, but we allow edits
    account.name = name || account.name;
    account.type = type || account.type;
    account.phoneNumber = phoneNumber !== undefined ? phoneNumber : account.phoneNumber;
    account.address = address !== undefined ? address : account.address;
    account.gstNumber = gstNumber !== undefined ? gstNumber : account.gstNumber;

    if (openingBalance !== undefined) {
      account.openingBalance = Number(openingBalance) || 0;
    }

    await account.save();

    // Recalculate balance to reflect changes in opening balance or type
    await recalculateAccountBalance(account._id);

    const updatedAccount = await Account.findById(account._id);
    res.json(updatedAccount);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an account and its transactions
// @route   DELETE /api/accounts/:id
// @access  Public (Company Scoped)
export const deleteAccount = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const account = await Account.findOne({ _id: req.params.id, companyId });

    if (!account) {
      res.status(404);
      throw new Error('Account not found in active company');
    }

    // Do not allow deleting system default Cash/Bank accounts if they are essential
    if ((account.name === 'Cash in Hand' && account.type === 'Cash') || 
        (account.name === 'Main Bank Account' && account.type === 'Bank')) {
      res.status(400);
      throw new Error('System default accounts cannot be deleted');
    }

    // Cascade delete transactions for this account
    await Transaction.deleteMany({ accountId: account._id });
    await Account.findByIdAndDelete(account._id);

    res.json({ message: 'Account and associated transactions deleted successfully' });
  } catch (error) {
    next(error);
  }
};
