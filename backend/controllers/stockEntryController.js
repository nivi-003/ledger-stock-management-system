import StockEntry from '../models/StockEntry.js';
import Product from '../models/Product.js';
import Account from '../models/Account.js';

// Helper to recalculate running stock quantity of a product
export const recalculateProductStock = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) return;

  const stockEntries = await StockEntry.find({ productId });

  let stockInSum = 0;
  let stockOutSum = 0;

  stockEntries.forEach((entry) => {
    if (entry.type === 'Stock In') {
      stockInSum += entry.quantity;
    } else if (entry.type === 'Stock Out') {
      stockOutSum += entry.quantity;
    }
  });

  product.currentQuantity = stockInSum - stockOutSum;
  await product.save();
};

// @desc    Get stock entries of active company
// @route   GET /api/stock-entries
// @access  Public (Company Scoped)
export const getStockEntries = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { productId, type } = req.query;

    const query = { companyId };

    if (productId) {
      query.productId = productId;
    }

    if (type) {
      query.type = type;
    }

    const stockEntries = await StockEntry.find(query)
      .populate('productId', 'name unit sku currentQuantity')
      .populate('accountId', 'name type')
      .sort({ date: -1, createdAt: -1 });

    res.json(stockEntries);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single stock entry details
// @route   GET /api/stock-entries/:id
// @access  Public (Company Scoped)
export const getStockEntryById = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const entry = await StockEntry.findOne({ _id: req.params.id, companyId })
      .populate('productId', 'name unit')
      .populate('accountId', 'name type');

    if (!entry) {
      res.status(404);
      throw new Error('Stock entry not found in active company');
    }

    res.json(entry);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new stock entry (adjusts product inventory)
// @route   POST /api/stock-entries
// @access  Public (Company Scoped)
export const createStockEntry = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { productId, type, quantity, unit, date, accountId, notes } = req.body;

    if (!productId || !type || quantity === undefined) {
      res.status(400);
      throw new Error('ProductId, type, and quantity are required');
    }

    // Verify product exists and belongs to company
    const product = await Product.findOne({ _id: productId, companyId });
    if (!product) {
      res.status(404);
      throw new Error('Product not found in active company');
    }

    // Optional account validation
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, companyId });
      if (!account) {
        res.status(404);
        throw new Error('Associated ledger account not found in active company');
      }
    }

    const qty = Number(quantity);

    // Prevent stock out that exceeds current quantity
    if (type === 'Stock Out' && product.currentQuantity < qty) {
      res.status(400);
      throw new Error(`Insufficient stock. Current available quantity is ${product.currentQuantity} ${product.unit}`);
    }

    const entry = await StockEntry.create({
      companyId,
      productId,
      type,
      quantity: qty,
      unit: unit || product.unit,
      date: date ? new Date(date) : new Date(),
      accountId: accountId || null,
      notes,
    });

    // Update product stock balance
    await recalculateProductStock(productId);

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a stock entry (adjusts product inventory)
// @route   PUT /api/stock-entries/:id
// @access  Public (Company Scoped)
export const updateStockEntry = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const entry = await StockEntry.findOne({ _id: req.params.id, companyId });

    if (!entry) {
      res.status(404);
      throw new Error('Stock entry not found in active company');
    }

    const { productId, type, quantity, unit, date, accountId, notes } = req.body;

    const oldProductId = entry.productId;
    const oldQty = entry.quantity;
    const oldType = entry.type;

    // Verify new product if changed
    if (productId && productId !== entry.productId.toString()) {
      const newProduct = await Product.findOne({ _id: productId, companyId });
      if (!newProduct) {
        res.status(404);
        throw new Error('New product not found in active company');
      }
      entry.productId = productId;
    }

    // Verify associated account if changed
    if (accountId !== undefined) {
      if (accountId) {
        const account = await Account.findOne({ _id: accountId, companyId });
        if (!account) {
          res.status(404);
          throw new Error('Associated account not found in active company');
        }
        entry.accountId = accountId;
      } else {
        entry.accountId = null;
      }
    }

    entry.type = type || entry.type;
    entry.quantity = quantity !== undefined ? Number(quantity) : entry.quantity;
    entry.unit = unit || entry.unit;
    entry.date = date ? new Date(date) : entry.date;
    entry.notes = notes !== undefined ? notes : entry.notes;

    // Check if updating this entry would result in negative stock for the product
    if (productId && productId !== oldProductId.toString()) {
      // Product changed
      const newProductObj = await Product.findById(productId);
      const newType = type || entry.type;
      const newQty = quantity !== undefined ? Number(quantity) : entry.quantity;
      if (newType === 'Stock Out' && newProductObj.currentQuantity < newQty) {
        res.status(400);
        throw new Error(`Insufficient stock on new product. Available: ${newProductObj.currentQuantity}`);
      }
    } else {
      // Same product, check net stock difference
      const currentProduct = await Product.findById(oldProductId);
      const newType = type || oldType;
      const newQty = quantity !== undefined ? Number(quantity) : oldQty;
      
      let stockChange = 0;
      
      // Calculate net change on the product's quantity
      if (oldType === 'Stock In') {
        stockChange -= oldQty; // remove old stock in
      } else {
        stockChange += oldQty; // restore old stock out
      }
      
      if (newType === 'Stock In') {
        stockChange += newQty;
      } else {
        stockChange -= newQty;
      }
      
      if (currentProduct.currentQuantity + stockChange < 0) {
        res.status(400);
        throw new Error(`Updating this entry results in negative stock. Available would be: ${currentProduct.currentQuantity + stockChange}`);
      }
    }

    const updatedEntry = await entry.save();

    // Recalculate old product stock
    await recalculateProductStock(oldProductId);

    // Recalculate new product stock if changed
    if (productId && productId !== oldProductId.toString()) {
      await recalculateProductStock(productId);
    }

    res.json(updatedEntry);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a stock entry (restores product inventory)
// @route   DELETE /api/stock-entries/:id
// @access  Public (Company Scoped)
export const deleteStockEntry = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const entry = await StockEntry.findOne({ _id: req.params.id, companyId });

    if (!entry) {
      res.status(404);
      throw new Error('Stock entry not found in active company');
    }

    const productId = entry.productId;
    const qty = entry.quantity;
    const type = entry.type;

    // Check if deletion would cause negative stock
    if (type === 'Stock In') {
      const product = await Product.findById(productId);
      if (product.currentQuantity - qty < 0) {
        res.status(400);
        throw new Error(`Cannot delete this entry. Deletion causes negative stock: current stock is ${product.currentQuantity}`);
      }
    }

    await StockEntry.findByIdAndDelete(entry._id);

    // Recalculate product stock
    await recalculateProductStock(productId);

    res.json({ message: 'Stock entry deleted successfully and inventory updated' });
  } catch (error) {
    next(error);
  }
};
