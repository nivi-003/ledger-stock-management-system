import express from 'express';
import {
  getSettings,
  updateSettings,
  exportBackup,
  importRestore,
} from '../controllers/settingsController.js';

const router = express.Router();

// Backup & Restore are global utilities
router.get('/backup', exportBackup);
router.post('/restore', importRestore);

// Scoped settings
router.route('/')
  .get(getSettings)
  .put(updateSettings);

export default router;
