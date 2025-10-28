const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Initialize database table
async function initDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            reference VARCHAR(255) UNIQUE NOT NULL,
            application_id VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'ZAR',
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            country VARCHAR(100),
            status VARCHAR(50) DEFAULT 'pending',
            payment_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    try {
        await pool.query(createTableQuery);
        console.log('✅ Payments table initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PayFast configuration
const getPayFastConfig = () => {
    // Use sandbox credentials for testing
    // User will replace these with their own credentials later
    return {
        merchantId: process.env.PAYFAST_MERCHANT_ID || '10000100',
        merchantKey: process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',
        passphrase: process.env.PAYFAST_PASSPHRASE || 'jt7NOE43FZPn',
        sandbox: process.env.PAYFAST_SANDBOX !== 'false', // Default to sandbox
        baseUrl: process.env.PAYFAST_SANDBOX !== 'false' 
            ? 'https://sandbox.payfast.co.za/eng/process' 
            : 'https://www.payfast.co.za/eng/process'
    };
};

// Generate MD5 signature for PayFast
function generateSignature(data, passphrase = null) {
    // Remove empty values and signature field - PayFast requirement
    const cleanData = {};
    Object.keys(data).forEach(key => {
        if (key !== 'signature' && data[key] !== '' && data[key] !== null && data[key] !== undefined) {
            cleanData[key] = data[key].toString().trim();
        }
    });
    
    // Sort keys alphabetically
    const sortedKeys = Object.keys(cleanData).sort();
    
    // Build parameter string with URL encoding
    let paramString = sortedKeys.map(key => {
        // URL encode and replace %20 with + (PayFast requirement)
        const encodedValue = encodeURIComponent(cleanData[key]).replace(/%20/g, '+');
        return `${key}=${encodedValue}`;
    }).join('&');
    
    // Add passphrase if provided
    if (passphrase) {
        const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
        paramString += `&passphrase=${encodedPassphrase}`;
    }
    
    // Debug log (remove in production)
    console.log('🔐 Signature string:', paramString);
    
    // Generate MD5 hash
    const signature = crypto.createHash('md5').update(paramString).digest('hex');
    console.log('🔐 Generated signature:', signature);
    
    return signature;
}

// POST /api/payments/start - Initiate PayFast payment
app.post('/api/payments/start', async (req, res) => {
    try {
        console.log('💳 Payment request received:', req.body);
        
        const {
            application_id,
            applicant_name,
            applicant_email,
            amount,
            country,
            description = 'UAE Visa Application Fee'
        } = req.body;
        
        // Validation
        if (!application_id || !applicant_name || !applicant_email || !amount) {
            return res.status(400).json({
                error: 'Missing required fields: application_id, applicant_name, applicant_email, amount'
            });
        }
        
        // Clean and trim input data
        const cleanName = applicant_name.trim().replace(/\s+/g, ' ');
        const cleanEmail = applicant_email.trim();
        
        // Split name properly
        const nameParts = cleanName.split(' ').filter(part => part.length > 0);
        const firstName = nameParts[0] || cleanName;
        const lastName = nameParts.slice(1).join(' ') || cleanName;
        
        // Generate unique reference
        const reference = `UAE-PAY-${Date.now()}`;
        
        // Get PayFast config
        const config = getPayFastConfig();
        
        // Get the base URL for return/cancel/notify URLs
        const appBaseUrl = process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}`
            : 'http://localhost:5000';
        
        // PayFast payment data
        const paymentData = {
            // Merchant details
            merchant_id: config.merchantId,
            merchant_key: config.merchantKey,
            
            // Buyer details
            name_first: firstName,
            name_last: lastName,
            email_address: cleanEmail,
            
            // Transaction details
            m_payment_id: reference,
            amount: parseFloat(amount).toFixed(2),
            item_name: description,
            item_description: `${description} - ${application_id}`,
            
            // URLs for callbacks
            return_url: `${appBaseUrl}/payment-success.html?ref=${reference}`,
            cancel_url: `${appBaseUrl}/payment.html?ref=${application_id}&name=${encodeURIComponent(applicant_name)}&email=${encodeURIComponent(applicant_email)}&amount=${amount}`,
            notify_url: `${appBaseUrl}/api/payments/verify`,
            
            // Custom fields
            custom_str1: application_id,
            custom_str2: country || 'Unknown'
        };
        
        // Generate signature
        paymentData.signature = generateSignature(paymentData, config.passphrase);
        
        // Save payment to database
        await pool.query(
            `INSERT INTO payments (reference, application_id, amount, currency, email, name, country, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [reference, application_id, amount, 'ZAR', applicant_email, applicant_name, country, 'pending']
        );
        
        // Build PayFast redirect URL with parameters
        const params = new URLSearchParams(paymentData);
        const paymentLink = `${config.baseUrl}?${params.toString()}`;
        
        console.log('✅ Payment initiated:', reference);
        
        res.json({
            success: true,
            paymentLink: paymentLink,
            reference: reference,
            gateway: 'payfast',
            sandbox: config.sandbox
        });
        
    } catch (error) {
        console.error('❌ Payment start error:', error);
        res.status(500).json({
            error: 'Failed to initiate payment',
            detail: error.message
        });
    }
});

// POST /api/payments/verify - PayFast ITN (Instant Transaction Notification)
app.post('/api/payments/verify', async (req, res) => {
    try {
        console.log('📡 Payment verification callback received');
        console.log('Body:', req.body);
        
        const data = req.body;
        const config = getPayFastConfig();
        
        // Verify signature
        const receivedSignature = data.signature;
        delete data.signature;
        
        const calculatedSignature = generateSignature(data, config.passphrase);
        
        if (receivedSignature !== calculatedSignature) {
            console.error('❌ Invalid signature');
            return res.status(400).send('Invalid signature');
        }
        
        // Extract payment details
        const reference = data.m_payment_id;
        const paymentStatus = data.payment_status;
        const paymentId = data.pf_payment_id;
        
        // Update database
        let status = 'pending';
        if (paymentStatus === 'COMPLETE') {
            status = 'paid';
        } else if (paymentStatus === 'FAILED') {
            status = 'failed';
        } else if (paymentStatus === 'CANCELLED') {
            status = 'cancelled';
        }
        
        await pool.query(
            `UPDATE payments 
             SET status = $1, payment_id = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE reference = $3`,
            [status, paymentId, reference]
        );
        
        console.log(`✅ Payment ${reference} updated to status: ${status}`);
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ Payment verification error:', error);
        res.status(500).send('Verification error');
    }
});

// GET /api/payments/status/:reference - Check payment status
app.get('/api/payments/status/:reference', async (req, res) => {
    try {
        const { reference } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM payments WHERE reference = $1',
            [reference]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('❌ Status check error:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'PayFast Payment Gateway',
        sandbox: getPayFastConfig().sandbox
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PayFast Payment Server running on port ${PORT}`);
    console.log(`📍 Base URL: http://localhost:${PORT}`);
    console.log(`🧪 Sandbox mode:`, getPayFastConfig().sandbox);
    console.log(`💳 Ready to process payments`);
});
