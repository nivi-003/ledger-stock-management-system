import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Customer', 'Supplier', 'Cash', 'Bank', 'Expense', 'Other'],
      required: [true, 'Account type is required'],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure account names are unique per company
accountSchema.index({ companyId: 1, name: 1 }, { unique: true });

const Account = mongoose.model('Account', accountSchema);
export default Account;
