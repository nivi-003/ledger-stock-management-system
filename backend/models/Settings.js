import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      unique: true,
    },
    appName: {
      type: String,
      default: 'Ledger & Stock Pro',
    },
    taxEnabled: {
      type: Boolean,
      default: false,
    },
    lowStockAlertThreshold: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
