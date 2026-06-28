import Company from '../models/Company.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import StockEntry from '../models/StockEntry.js';
import Settings from '../models/Settings.js';
import { recalculateAccountBalance } from '../controllers/accountController.js';
import { recalculateProductStock } from '../controllers/stockEntryController.js';

export const seedData = async () => {
  try {
    const companyCount = await Company.countDocuments({});
    
    // Only seed if database has no companies
    if (companyCount > 0) {
      console.log('Database already has data. Skipping seeder.');
      return;
    }

    console.log('Seeding database with professional dummy data...');

    // 1. Create Company
    const company = await Company.create({
      name: 'Sri Lakshmi Traders',
      address: '12, Bazaar Street, Gandhinagar, Chennai - 600020',
      phoneNumber: '+91 98765 43210',
      email: 'contact@lakshmitraders.com',
      gstNumber: '33AABCS1421D1Z5',
      financialYear: '2026-2027',
    });

    const companyId = company._id;

    // 2. Create Company Settings
    await Settings.create({
      companyId,
      appName: 'Sri Lakshmi Traders Ledger',
      taxEnabled: true,
      lowStockAlertThreshold: 10,
    });

    // 3. Create Accounts
    // Default Cash & Bank Accounts (usually auto-created in controller, but we seed manually here to ensure control)
    const cashAcc = await Account.create({
      companyId,
      name: 'Cash in Hand',
      type: 'Cash',
      openingBalance: 15000,
      balance: 15000,
    });

    const bankAcc = await Account.create({
      companyId,
      name: 'Main Bank Account',
      type: 'Bank',
      openingBalance: 75000,
      balance: 75000,
    });

    // Customers
    const custRamesh = await Account.create({
      companyId,
      name: 'Ramesh Kumar',
      type: 'Customer',
      phoneNumber: '+91 98401 23456',
      address: '45, Anna Nagar, Chennai',
      gstNumber: '33ABCDE1234F1Z1',
      openingBalance: 10000, // Debits (outstanding receivable)
      balance: 10000,
    });

    const custAnitha = await Account.create({
      companyId,
      name: 'Anitha Supermarket',
      type: 'Customer',
      phoneNumber: '+91 99620 98765',
      address: '7, T-Nagar, Chennai',
      gstNumber: '33FGHIJ5678K2Z2',
      openingBalance: 8500,
      balance: 8500,
    });

    // Suppliers
    const suppPriya = await Account.create({
      companyId,
      name: 'Priya Distributors',
      type: 'Supplier',
      phoneNumber: '+91 94440 55555',
      address: '102, Koyambedu Market, Chennai',
      gstNumber: '33LMNOP9012Q3Z3',
      openingBalance: 25000, // Credits (outstanding payable)
      balance: 25000,
    });

    const suppBalaji = await Account.create({
      companyId,
      name: 'Balaji Agro Foods',
      type: 'Supplier',
      phoneNumber: '+91 95000 66666',
      address: '32, Redhills Road, Chennai',
      gstNumber: '33QRSTU3456V4Z4',
      openingBalance: 14000,
      balance: 14000,
    });

    // Expense Accounts
    const expRent = await Account.create({
      companyId,
      name: 'Shop Rent Account',
      type: 'Expense',
      openingBalance: 0,
      balance: 0,
    });

    const expElectricity = await Account.create({
      companyId,
      name: 'Electricity Bills',
      type: 'Expense',
      openingBalance: 0,
      balance: 0,
    });

    // 4. Create Products
    const prodRice = await Product.create({
      companyId,
      name: 'Premium Basmati Rice 25kg',
      category: 'Grains',
      sku: 'RICE-BAS-25',
      unit: 'Bags',
      purchasePrice: 1600,
      sellingPrice: 1950,
      currentQuantity: 30,
      minStockAlert: 10,
    });

    const prodWheat = await Product.create({
      companyId,
      name: 'Whole Wheat Atta 10kg',
      category: 'Flour',
      sku: 'WHT-ATTA-10',
      unit: 'Packets',
      purchasePrice: 380,
      sellingPrice: 460,
      currentQuantity: 25,
      minStockAlert: 8,
    });

    const prodSugar = await Product.create({
      companyId,
      name: 'Refined Sugar 50kg',
      category: 'Sweeteners',
      sku: 'SUG-REF-50',
      unit: 'Bags',
      purchasePrice: 1900,
      sellingPrice: 2200,
      currentQuantity: 6, // Low stock!
      minStockAlert: 8,
    });

    const prodOil = await Product.create({
      companyId,
      name: 'Sunflower Cooking Oil 1L',
      category: 'Edible Oils',
      sku: 'OIL-SUN-1L',
      unit: 'Bottles',
      purchasePrice: 115,
      sellingPrice: 145,
      currentQuantity: 100,
      minStockAlert: 20,
    });

    // 5. Create Stock Entries for the products (Initial Stock / Opening Stock)
    const today = new Date();
    const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Rice Stock Entries
    await StockEntry.create({
      companyId,
      productId: prodRice._id,
      type: 'Stock In',
      quantity: 40,
      unit: 'Bags',
      date: tenDaysAgo,
      notes: 'Initial Opening Stock purchase',
      accountId: suppPriya._id,
    });
    await StockEntry.create({
      companyId,
      productId: prodRice._id,
      type: 'Stock Out',
      quantity: 10,
      unit: 'Bags',
      date: fiveDaysAgo,
      notes: 'Bulk sale to Ramesh Kumar',
      accountId: custRamesh._id,
    });

    // Wheat Stock Entries
    await StockEntry.create({
      companyId,
      productId: prodWheat._id,
      type: 'Stock In',
      quantity: 35,
      unit: 'Packets',
      date: tenDaysAgo,
      notes: 'Initial purchase from Balaji Agro',
      accountId: suppBalaji._id,
    });
    await StockEntry.create({
      companyId,
      productId: prodWheat._id,
      type: 'Stock Out',
      quantity: 10,
      unit: 'Packets',
      date: sevenDaysAgo,
      notes: 'Counter sales',
    });

    // Sugar Stock Entries
    await StockEntry.create({
      companyId,
      productId: prodSugar._id,
      type: 'Stock In',
      quantity: 12,
      unit: 'Bags',
      date: tenDaysAgo,
      notes: 'Opening stock buy',
      accountId: suppPriya._id,
    });
    await StockEntry.create({
      companyId,
      productId: prodSugar._id,
      type: 'Stock Out',
      quantity: 6,
      unit: 'Bags',
      date: twoDaysAgo,
      notes: 'Sale to Anitha Supermarket',
      accountId: custAnitha._id,
    });

    // Oil Stock Entries
    await StockEntry.create({
      companyId,
      productId: prodOil._id,
      type: 'Stock In',
      quantity: 120,
      unit: 'Bottles',
      date: tenDaysAgo,
      notes: 'Opening stock purchase',
      accountId: suppBalaji._id,
    });
    await StockEntry.create({
      companyId,
      productId: prodOil._id,
      type: 'Stock Out',
      quantity: 20,
      unit: 'Bottles',
      date: fiveDaysAgo,
      notes: 'Retail sales',
    });

    // 6. Create Transactions
    // 5 days ago: Customer Ramesh Kumar paid us cash
    await Transaction.create({
      companyId,
      accountId: custRamesh._id,
      type: 'Receipt',
      amount: 4500,
      date: fiveDaysAgo,
      paymentMode: 'Cash',
      notes: 'Partial payment against outstanding',
    });

    // 4 days ago: We paid Supplier Priya Distributors via Bank Transfer
    await Transaction.create({
      companyId,
      accountId: suppPriya._id,
      type: 'Payment',
      amount: 10000,
      date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      paymentMode: 'Bank Transfer',
      notes: 'Part payment of old dues',
      referenceNumber: 'TXN849204128',
    });

    // 3 days ago: Rent payment to Landlord
    await Transaction.create({
      companyId,
      accountId: expRent._id,
      type: 'Payment',
      amount: 12000,
      date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      paymentMode: 'Bank Transfer',
      notes: 'Office warehouse rent for June 2026',
      referenceNumber: 'RENT58920410',
    });

    // 2 days ago: Customer Anitha Supermarket paid us via UPI
    await Transaction.create({
      companyId,
      accountId: custAnitha._id,
      type: 'Receipt',
      amount: 5000,
      date: twoDaysAgo,
      paymentMode: 'UPI',
      notes: 'Bill payment UPI',
      referenceNumber: 'UPI90481230491',
    });

    // 1 day ago: Electricity bills payment
    await Transaction.create({
      companyId,
      accountId: expElectricity._id,
      type: 'Payment',
      amount: 2400,
      date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      paymentMode: 'Cash',
      notes: 'May month electricity charges',
    });

    // 7. Trigger Recalculations for ALL Accounts and Products
    const allAccounts = await Account.find({ companyId });
    for (let acc of allAccounts) {
      await recalculateAccountBalance(acc._id);
    }

    const allProducts = await Product.find({ companyId });
    for (let prod of allProducts) {
      await recalculateProductStock(prod._id);
    }

    // Recalculate Cash/Bank balances (done inside the controllers normally, but let's calculate here for the seeder)
    const transactions = await Transaction.find({
      companyId,
      accountId: { $nin: [cashAcc._id, bankAcc._id] }
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
        if (tx.type === 'Receipt') bankReceipts += tx.amount;
        if (tx.type === 'Payment') bankPayments += tx.amount;
      }
    });

    cashAcc.balance = cashAcc.openingBalance + cashReceipts - cashPayments;
    await cashAcc.save();

    bankAcc.balance = bankAcc.openingBalance + bankReceipts - bankPayments;
    await bankAcc.save();

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};
