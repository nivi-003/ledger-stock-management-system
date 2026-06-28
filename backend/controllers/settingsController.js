import Settings from '../models/Settings.js';
import Company from '../models/Company.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import StockEntry from '../models/StockEntry.js';

// @desc    Get settings of active company
// @route   GET /api/settings
// @access  Public (Company Scoped)
export const getSettings = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    let settings = await Settings.findOne({ companyId });

    if (!settings) {
      // Auto-create settings if not found
      settings = await Settings.create({
        companyId,
        appName: 'Ledger & Stock Pro',
      });
    }

    // Include data summary metrics
    const accountsCount = await Account.countDocuments({ companyId });
    const transactionsCount = await Transaction.countDocuments({ companyId });
    const productsCount = await Product.countDocuments({ companyId });
    const stockEntriesCount = await StockEntry.countDocuments({ companyId });

    res.json({
      settings,
      summary: {
        accountsCount,
        transactionsCount,
        productsCount,
        stockEntriesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings of active company
// @route   PUT /api/settings
// @access  Public (Company Scoped)
export const updateSettings = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    let settings = await Settings.findOne({ companyId });

    if (!settings) {
      res.status(404);
      throw new Error('Settings not found for this company');
    }

    const { appName, taxEnabled, lowStockAlertThreshold } = req.body;

    settings.appName = appName || settings.appName;
    if (taxEnabled !== undefined) settings.taxEnabled = taxEnabled;
    if (lowStockAlertThreshold !== undefined) settings.lowStockAlertThreshold = Number(lowStockAlertThreshold) || 0;

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    next(error);
  }
};

// @desc    Export database backup (Entire database JSON dump)
// @route   GET /api/settings/backup
// @access  Public
export const exportBackup = async (req, res, next) => {
  try {
    // Fetch all documents from all collections to create a full system backup
    const companies = await Company.find({});
    const accounts = await Account.find({});
    const transactions = await Transaction.find({});
    const products = await Product.find({});
    const stockEntries = await StockEntry.find({});
    const settings = await Settings.find({});

    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      companies,
      accounts,
      transactions,
      products,
      stockEntries,
      settings,
    };

    res.setHeader('Content-disposition', 'attachment; filename=ledger_stock_backup.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    next(error);
  }
};

// @desc    Import database restore (Clears and populates entire database)
// @route   POST /api/settings/restore
// @access  Public
export const importRestore = async (req, res, next) => {
  try {
    const backupData = req.body;

    if (!backupData || !backupData.companies || !backupData.accounts || !backupData.products) {
      res.status(400);
      throw new Error('Invalid backup file. Missing required collections data.');
    }

    // Clear all existing databases collections!
    await Company.deleteMany({});
    await Account.deleteMany({});
    await Transaction.deleteMany({});
    await Product.deleteMany({});
    await StockEntry.deleteMany({});
    await Settings.deleteMany({});

    // Bulk insert the restored documents
    if (backupData.companies.length > 0) await Company.insertMany(backupData.companies);
    if (backupData.accounts.length > 0) await Account.insertMany(backupData.accounts);
    if (backupData.transactions.length > 0) await Transaction.insertMany(backupData.transactions);
    if (backupData.products.length > 0) await Product.insertMany(backupData.products);
    if (backupData.stockEntries.length > 0) await StockEntry.insertMany(backupData.stockEntries);
    if (backupData.settings && backupData.settings.length > 0) {
      await Settings.insertMany(backupData.settings);
    } else {
      // Create defaults for restored companies if settings are empty
      for (const comp of backupData.companies) {
        await Settings.create({
          companyId: comp._id,
          appName: `${comp.name} Ledger`,
        });
      }
    }

    res.json({ message: 'Database restored successfully! All tables reloaded.' });
  } catch (error) {
    next(error);
  }
};
