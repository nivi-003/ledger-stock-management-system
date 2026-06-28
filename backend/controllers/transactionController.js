import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import { recalculateAccountBalance } from './accountController.js';

// Helper to recalculate cash and bank balances in the company
const syncCashAndBankBalances = async (companyId) => {
  try {
    // Find Cash in Hand and Main Bank Account
    const cashAccount = await Account.findOne({ companyId, type: 'Cash', name: 'Cash in Hand' });
    const bankAccount = await Account.findOne({ companyId, type: 'Bank', name: 'Main Bank Account' });

    if (!cashAccount && !bankAccount) return;

    // Get all transactions excluding ones directly logged against Cash/Bank accounts to avoid self-looping
    const excludeIds = [];
    if (cashAccount) excludeIds.push(cashAccount._id);
    if (bankAccount) excludeIds.push(bankAccount._id);

    const transactions = await Transaction.find({
      companyId,
      accountId: { $nin: excludeIds }
    });

    let cashReceipts = 0;
    let cashPayments = 0;
    let bankReceipts = 0;
    let bankPayments = 0;

    transactions.forEach((tx) => {
      if (tx.paymentMode === 'Cash') {
        if (tx.type === 'Receipt') cashReceipts += tx.amount;
        if (tx.type === 'Payment') cashPayments += tx.amount;
      } else {
        // UPI, Bank Transfer, Card, Cheque
        if (tx.type === 'Receipt') bankReceipts += tx.amount;
        if (tx.type === 'Payment') bankPayments += tx.amount;
      }
    });

    if (cashAccount) {
      cashAccount.balance = cashAccount.openingBalance + cashReceipts - cashPayments;
      await cashAccount.save();
    }

    if (bankAccount) {
      bankAccount.balance = bankAccount.openingBalance + bankReceipts - bankPayments;
      await bankAccount.save();
    }
  } catch (error) {
    console.error('Error syncing cash/bank balances:', error.message);
  }
};

// @desc    Get all transactions of active company
// @route   GET /api/transactions
// @access  Public (Company Scoped)
export const getTransactions = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { accountId, startDate, endDate, search } = req.query;

    const query = { companyId };

    if (accountId) {
      query.accountId = accountId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // Fetch transactions and populate account info
    let transactions = await Transaction.find(query)
      .populate('accountId', 'name type')
      .sort({ date: -1, createdAt: -1 });

    // Filter by account name search if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      transactions = transactions.filter(
        (tx) => tx.accountId && searchRegex.test(tx.accountId.name)
      );
    }

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single transaction by ID
// @route   GET /api/transactions/:id
// @access  Public (Company Scoped)
export const getTransactionById = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const transaction = await Transaction.findOne({ _id: req.params.id, companyId }).populate(
      'accountId',
      'name type'
    );

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found in active company');
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Public (Company Scoped)
export const createTransaction = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { accountId, type, amount, date, paymentMode, notes, referenceNumber } = req.body;

    if (!accountId || !type || !amount || !paymentMode) {
      res.status(400);
      throw new Error('AccountId, type, amount, and paymentMode are required');
    }

    // Verify account exists and belongs to company
    const account = await Account.findOne({ _id: accountId, companyId });
    if (!account) {
      res.status(404);
      throw new Error('Account not found in active company');
    }

    const transaction = await Transaction.create({
      companyId,
      accountId,
      type,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      paymentMode,
      notes,
      referenceNumber,
    });

    // Update target account running balance
    await recalculateAccountBalance(accountId);

    // Sync Cash/Bank balances
    await syncCashAndBankBalances(companyId);

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Public (Company Scoped)
export const updateTransaction = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const transaction = await Transaction.findOne({ _id: req.params.id, companyId });

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found in active company');
    }

    const { accountId, type, amount, date, paymentMode, notes, referenceNumber } = req.body;

    const oldAccountId = transaction.accountId;

    // Check account transition
    if (accountId && accountId !== transaction.accountId.toString()) {
      const newAccount = await Account.findOne({ _id: accountId, companyId });
      if (!newAccount) {
        res.status(404);
        throw new Error('New account not found in active company');
      }
      transaction.accountId = accountId;
    }

    transaction.type = type || transaction.type;
    transaction.amount = amount !== undefined ? Number(amount) : transaction.amount;
    transaction.date = date ? new Date(date) : transaction.date;
    transaction.paymentMode = paymentMode || transaction.paymentMode;
    transaction.notes = notes !== undefined ? notes : transaction.notes;
    transaction.referenceNumber = referenceNumber !== undefined ? referenceNumber : transaction.referenceNumber;

    const updatedTransaction = await transaction.save();

    // Recalculate old account balance
    await recalculateAccountBalance(oldAccountId);

    // Recalculate new account balance if changed
    if (accountId && accountId !== oldAccountId.toString()) {
      await recalculateAccountBalance(accountId);
    }

    // Sync Cash/Bank balances
    await syncCashAndBankBalances(companyId);

    res.json(updatedTransaction);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Public (Company Scoped)
export const deleteTransaction = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const transaction = await Transaction.findOne({ _id: req.params.id, companyId });

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found in active company');
    }

    const accountId = transaction.accountId;

    await Transaction.findByIdAndDelete(transaction._id);

    // Recalculate account balance
    await recalculateAccountBalance(accountId);

    // Sync Cash/Bank balances
    await syncCashAndBankBalances(companyId);

    res.json({ message: 'Transaction deleted successfully and balances synchronized' });
  } catch (error) {
    next(error);
  }
};
