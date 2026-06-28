import express from 'express';
import {
  getDashboardData,
  getReportsSummary,
  getReportsLedger,
  getReportsInventory,
} from '../controllers/reportController.js';

const router = express.Router();

router.get('/dashboard', getDashboardData);
router.get('/summary', getReportsSummary);
router.get('/ledger', getReportsLedger);
router.get('/inventory', getReportsInventory);

export default router;
