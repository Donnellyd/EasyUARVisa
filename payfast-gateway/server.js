/**
 * PayFast Payment Gateway Server
 * Standalone payment processing service for South African payments
 * Ready to deploy on Replit
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const { createPaymentRoutes } = require('./routes/payments');
const { initDatabase } = require('./database/init');
const { getPayFastConfig } = require('./config/payfast');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Initialize database on startup
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    const config = getPayFastConfig();
    res.json({ 
        status: 'ok', 
        service: 'PayFast Payment Gateway',
        version: '1.0.0',
        payfast_mode: config.sandbox ? 'sandbox' : 'production',
        gateway: 'payfast'
    });
});

// Mount payment routes
app.use('/api/payments', createPaymentRoutes(pool));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'PayFast Payment Gateway API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            startPayment: 'POST /api/payments/start',
            verifyPayment: 'POST /api/payments/verify',
            checkStatus: 'GET /api/payments/status/:reference'
        },
        documentation: 'See API.md for complete documentation'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 PayFast Payment Gateway Server');
    console.log('='.repeat(50));
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
    console.log(`🧪 PayFast Mode: ${getPayFastConfig().sandbox ? 'SANDBOX' : 'PRODUCTION'}`);
    console.log(`💳 Gateway: PayFast (South Africa)`);
    console.log('='.repeat(50) + '\n');
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('⏸️  SIGTERM received, closing server...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('⏸️  SIGINT received, closing server...');
    await pool.end();
    process.exit(0);
});
