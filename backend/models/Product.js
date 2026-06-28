import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    sku: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
      default: 'Pcs',
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Selling price cannot be negative'],
    },
    currentQuantity: {
      type: Number,
      default: 0,
    },
    minStockAlert: {
      type: Number,
      default: 0,
      min: [0, 'Minimum stock alert cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure products are unique by name per company
productSchema.index({ companyId: 1, name: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
