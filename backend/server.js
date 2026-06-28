import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { companyScope } from './middleware/companyScope.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { seedData } from './utils/dummyDataSeeder.js';

// Route imports
import companyRoutes from './routes/companyRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import productRoutes from './routes/productRoutes.js';
import stockEntryRoutes from './routes/stockEntryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

// Run dummy data seeder
seedData();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support larger payloads for DB restore imports
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply Company Scoping globally (bypasses companies & settings/backup/restore)
app.use(companyScope);

// Routes
app.use('/api/companies', companyRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock-entries', stockEntryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Ledger and Stock Management API is running...');
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
