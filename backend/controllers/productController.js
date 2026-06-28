import Product from '../models/Product.js';
import StockEntry from '../models/StockEntry.js';

// @desc    Get all products of active company
// @route   GET /api/products
// @access  Public (Company Scoped)
export const getProducts = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { search, category, lowStock } = req.query;

    const query = { companyId };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    let products = await Product.find(query).sort({ name: 1 });

    // Filter low stock if requested
    if (lowStock === 'true') {
      products = products.filter((product) => product.currentQuantity <= product.minStockAlert);
    }

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Public (Company Scoped)
export const getProductById = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const product = await Product.findOne({ _id: req.params.id, companyId });

    if (!product) {
      res.status(404);
      throw new Error('Product not found in active company');
    }

    // Fetch its stock entries history
    const stockHistory = await StockEntry.find({ productId: product._id })
      .populate('accountId', 'name type')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      product,
      history: stockHistory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Public (Company Scoped)
export const createProduct = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { name, category, sku, unit, purchasePrice, sellingPrice, currentQuantity, minStockAlert } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Product name is required');
    }

    // Check duplicate
    const existing = await Product.findOne({ companyId, name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      res.status(400);
      throw new Error(`Product with name "${name}" already exists in this company`);
    }

    const initialQty = Number(currentQuantity) || 0;

    const product = await Product.create({
      companyId,
      name,
      category: category || 'General',
      sku,
      unit: unit || 'Pcs',
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      currentQuantity: initialQty,
      minStockAlert: Number(minStockAlert) || 0,
    });

    // If opening stock is greater than 0, create a Stock In entry for ledger transparency
    if (initialQty > 0) {
      await StockEntry.create({
        companyId,
        productId: product._id,
        type: 'Stock In',
        quantity: initialQty,
        unit: product.unit,
        date: new Date(),
        notes: 'Opening Stock',
      });
    }

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Public (Company Scoped)
export const updateProduct = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const product = await Product.findOne({ _id: req.params.id, companyId });

    if (!product) {
      res.status(404);
      throw new Error('Product not found in active company');
    }

    const { name, category, sku, unit, purchasePrice, sellingPrice, minStockAlert } = req.body;

    // Check duplicate if name is changing
    if (name && name.toLowerCase() !== product.name.toLowerCase()) {
      const duplicate = await Product.findOne({ companyId, name: { $regex: `^${name}$`, $options: 'i' } });
      if (duplicate) {
        res.status(400);
        throw new Error(`Another product with name "${name}" already exists in this company`);
      }
    }

    product.name = name || product.name;
    product.category = category !== undefined ? category : product.category;
    product.sku = sku !== undefined ? sku : product.sku;
    product.unit = unit || product.unit;
    product.purchasePrice = purchasePrice !== undefined ? Number(purchasePrice) : product.purchasePrice;
    product.sellingPrice = sellingPrice !== undefined ? Number(sellingPrice) : product.sellingPrice;
    product.minStockAlert = minStockAlert !== undefined ? Number(minStockAlert) : product.minStockAlert;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product and its stock history
// @route   DELETE /api/products/:id
// @access  Public (Company Scoped)
export const deleteProduct = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const product = await Product.findOne({ _id: req.params.id, companyId });

    if (!product) {
      res.status(404);
      throw new Error('Product not found in active company');
    }

    // Cascade delete stock entries for this product
    await StockEntry.deleteMany({ productId: product._id });
    await Product.findByIdAndDelete(product._id);

    res.json({ message: 'Product and associated stock entries deleted successfully' });
  } catch (error) {
    next(error);
  }
};
