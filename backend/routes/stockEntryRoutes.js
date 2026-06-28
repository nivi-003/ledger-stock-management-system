import express from 'express';
import {
  getStockEntries,
  getStockEntryById,
  createStockEntry,
  updateStockEntry,
  deleteStockEntry,
} from '../controllers/stockEntryController.js';

const router = express.Router();

router.route('/')
  .get(getStockEntries)
  .post(createStockEntry);

router.route('/:id')
  .get(getStockEntryById)
  .put(updateStockEntry)
  .delete(deleteStockEntry);

export default router;
