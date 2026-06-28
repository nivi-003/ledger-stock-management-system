import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import StockEntry from '../models/StockEntry.js';

// @desc    Get dashboard summary statistics and charts data
// @route   GET /api/reports/dashboard
// @access  Public (Company Scoped)
export const getDashboardData = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    // 1. Cash In Hand (Cash + Bank accounts balances)
    const cashBankAccounts = await Account.find({
      companyId,
      type: { $in: ['Cash', 'Bank'] },
    });
    const cashInHand = cashBankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 2. Receivables (Customer accounts with positive balance)
    const customerAccounts = await Account.find({
      companyId,
      type: 'Customer',
      balance: { $gt: 0 },
    });
    const receivables = customerAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 3. Payables (Supplier accounts with positive balance)
    const supplierAccounts = await Account.find({
      companyId,
      type: 'Supplier',
      balance: { $gt: 0 },
    });
    const payables = supplierAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 4. Inventory Value (currentQuantity * purchasePrice)
    const products = await Product.find({ companyId });
    const inventoryValue = products.reduce(
      (sum, prod) => sum + Math.max(0, prod.currentQuantity) * prod.purchasePrice,
      0
    );

    // 5. Recent Transactions (last 5)
    const recentTransactions = await Transaction.find({ companyId })
      .populate('accountId', 'name type')
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    // 6. Chart: Income vs Expense (Receipts vs Payments) monthly (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const transactionsLast6Months = await Transaction.find({
      companyId,
      date: { $gte: sixMonthsAgo },
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomeExpenseData = [];

    // Initialize 6 months structure
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      incomeExpenseData.push({
        monthName: months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(-2),
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        income: 0, // Receipts
        expense: 0, // Payments
      });
    }

    transactionsLast6Months.forEach((tx) => {
      const txDate = new Date(tx.date);
      const txMonth = txDate.getMonth();
      const txYear = txDate.getFullYear();

      const monthData = incomeExpenseData.find(
        (m) => m.monthIndex === txMonth && m.year === txYear
      );

      if (monthData) {
        if (tx.type === 'Receipt') {
          monthData.income += tx.amount;
        } else if (tx.type === 'Payment') {
          monthData.expense += tx.amount;
        }
      }
    });

    // 7. Chart: Inventory Category Overview (Sum of stock value per category)
    const categoryMap = {};
    products.forEach((prod) => {
      const cat = prod.category || 'General';
      const val = Math.max(0, prod.currentQuantity) * prod.purchasePrice;
      categoryMap[cat] = (categoryMap[cat] || 0) + val;
    });

    const inventoryOverview = Object.keys(categoryMap).map((cat) => ({
      name: cat,
      value: categoryMap[cat],
    }));

    res.json({
      summary: {
        cashInHand,
        receivables,
        payables,
        inventoryValue,
      },
      recentTransactions,
      charts: {
        incomeExpense: incomeExpenseData.map((d) => ({
          month: d.monthName,
          income: d.income,
          expense: d.expense,
        })),
        inventoryOverview,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports summary tab data (Sales, Purchases, Receipts, Payments, Profit, Expenses)
// @route   GET /api/reports/summary
// @access  Public (Company Scoped)
export const getReportsSummary = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // 1. Transactions - Receipts & Payments
    const txQuery = { companyId };
    if (startDate || endDate) txQuery.date = dateFilter;

    const transactions = await Transaction.find(txQuery).populate('accountId', 'type');

    let totalReceipts = 0;
    let totalPayments = 0;
    let totalExpenses = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'Receipt') {
        totalReceipts += tx.amount;
      } else if (tx.type === 'Payment') {
        totalPayments += tx.amount;
        // If paid to an Expense account
        if (tx.accountId && tx.accountId.type === 'Expense') {
          totalExpenses += tx.amount;
        }
      }
    });

    // 2. Stock movement for Sales & Purchases calculations
    const stockQuery = { companyId };
    if (startDate || endDate) stockQuery.date = dateFilter;

    const stockEntries = await StockEntry.find(stockQuery).populate('productId');

    let totalSales = 0;
    let totalPurchases = 0;

    stockEntries.forEach((entry) => {
      if (entry.productId) {
        if (entry.type === 'Stock Out') {
          totalSales += entry.quantity * entry.productId.sellingPrice;
        } else if (entry.type === 'Stock In' && entry.notes !== 'Opening Stock') {
          // Exclude opening stock from purchases report
          totalPurchases += entry.quantity * entry.productId.purchasePrice;
        }
      }
    });

    const netProfit = totalSales - totalPurchases - totalExpenses;

    res.json({
      totalSales,
      totalPurchases,
      totalReceipts,
      totalPayments,
      totalExpenses,
      netProfit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports ledger tab data (Account list with balance summary details)
// @route   GET /api/reports/ledger
// @access  Public (Company Scoped)
export const getReportsLedger = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { startDate, endDate } = req.query;

    const accounts = await Account.find({ companyId }).sort({ name: 1 });

    const ledgerReport = [];

    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    for (let account of accounts) {
      // Find transactions in date range
      const txQuery = { accountId: account._id };
      if (startDate || endDate) txQuery.date = dateFilter;

      const transactions = await Transaction.find(txQuery);

      let totalReceipts = 0; // Credit
      let totalPayments = 0; // Debit

      transactions.forEach((tx) => {
        if (tx.type === 'Receipt') {
          totalReceipts += tx.amount;
        } else if (tx.type === 'Payment') {
          totalPayments += tx.amount;
        }
      });

      // Calculate historical opening balance prior to startDate if provided
      let periodOpeningBalance = account.openingBalance;

      if (startDate) {
        // Get all transactions before startDate to find what the opening balance was at startDate
        const pastTxQuery = {
          accountId: account._id,
          date: { $lt: new Date(startDate) },
        };
        const pastTransactions = await Transaction.find(pastTxQuery);

        let pastReceipts = 0;
        let pastPayments = 0;

        pastTransactions.forEach((tx) => {
          if (tx.type === 'Receipt') pastReceipts += tx.amount;
          if (tx.type === 'Payment') pastPayments += tx.amount;
        });

        // Compute opening balance at that start date
        if (account.type === 'Customer') {
          periodOpeningBalance = account.openingBalance + pastPayments - pastReceipts;
        } else if (account.type === 'Supplier') {
          periodOpeningBalance = account.openingBalance + pastReceipts - pastPayments;
        } else if (account.type === 'Cash' || account.type === 'Bank') {
          periodOpeningBalance = account.openingBalance + pastReceipts - pastPayments;
        } else {
          periodOpeningBalance = account.openingBalance + pastPayments - pastReceipts;
        }
      }

      // Period closing balance
      let periodClosingBalance = 0;
      if (account.type === 'Customer') {
        periodClosingBalance = periodOpeningBalance + totalPayments - totalReceipts;
      } else if (account.type === 'Supplier') {
        periodClosingBalance = periodOpeningBalance + totalReceipts - totalPayments;
      } else if (account.type === 'Cash' || account.type === 'Bank') {
        periodClosingBalance = periodOpeningBalance + totalReceipts - totalPayments;
      } else {
        periodClosingBalance = periodOpeningBalance + totalPayments - totalReceipts;
      }

      ledgerReport.push({
        _id: account._id,
        name: account.name,
        type: account.type,
        openingBalance: periodOpeningBalance,
        totalReceipts,
        totalPayments,
        closingBalance: periodClosingBalance,
      });
    }

    res.json(ledgerReport);
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports inventory tab data (Current stock valuation and movement summary)
// @route   GET /api/reports/inventory
// @access  Public (Company Scoped)
export const getReportsInventory = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { startDate, endDate } = req.query;

    const products = await Product.find({ companyId }).sort({ name: 1 });

    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const inventoryReport = [];

    for (let product of products) {
      // Find stock entries in range
      const stockQuery = { productId: product._id };
      if (startDate || endDate) stockQuery.date = dateFilter;

      const entries = await StockEntry.find(stockQuery);

      let totalStockIn = 0;
      let totalStockOut = 0;

      entries.forEach((e) => {
        if (e.type === 'Stock In') {
          totalStockIn += e.quantity;
        } else if (e.type === 'Stock Out') {
          totalStockOut += e.quantity;
        }
      });

      inventoryReport.push({
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        currentStock: product.currentQuantity,
        stockIn: totalStockIn,
        stockOut: totalStockOut,
        stockValue: Math.max(0, product.currentQuantity) * product.purchasePrice,
        isLowStock: product.currentQuantity <= product.minStockAlert,
      });
    }

    res.json(inventoryReport);
  } catch (error) {
    next(error);
  }
};
