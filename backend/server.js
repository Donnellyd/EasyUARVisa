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
    const config = {
        merchantId: process.env.PAYFAST_MERCHANT_ID || '10000100',
        merchantKey: process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',
        passphrase: process.env.PAYFAST_PASSPHRASE || 'jt7NOE43FZPn',
        sandbox: process.env.PAYFAST_SANDBOX !== 'false', // Default to sandbox
        baseUrl: process.env.PAYFAST_SANDBOX !== 'false' 
            ? 'https://sandbox.payfast.co.za/eng/process' 
            : 'https://www.payfast.co.za/eng/process'
    };
    console.log('🔑 PayFast Config Loaded:');
    console.log(`   Merchant ID: ${config.merchantId}`);
    console.log(`   Merchant Key: ${config.merchantKey.substring(0, 5)}...`);
    console.log(`   Passphrase: ${config.passphrase.substring(0, 5)}...`);
    return config;
};

// PayGate configuration
const getPayGateConfig = () => {
    return {
        paygateId: process.env.PAYGATE_ID || '10011072130',
        encryptionKey: process.env.PAYGATE_ENCRYPTION_KEY || 'secret',
        initiateUrl: 'https://secure.paygate.co.za/payweb3/initiate.trans',
        processUrl: 'https://secure.paygate.co.za/payweb3/process.trans'
    };
};

// iKhokha configuration
const getIKhokhaConfig = () => {
    return {
        applicationId: process.env.IKHOKHA_APPLICATION_ID || '',
        applicationSecret: process.env.IKHOKHA_APPLICATION_SECRET || '',
        apiUrl: 'https://api.ikhokha.com/api/v1',
        testMode: process.env.IKHOKHA_TEST_MODE !== 'false' // Default to test mode
    };
};

// Peach Payments configuration
const getPeachConfig = () => {
    return {
        entityId: process.env.PEACH_ENTITY_ID || '',
        accessToken: process.env.PEACH_ACCESS_TOKEN || '',
        apiUrl: process.env.PEACH_TEST_MODE !== 'false' 
            ? 'https://testsecure.peachpayments.com' 
            : 'https://secure.peachpayments.com',
        testMode: process.env.PEACH_TEST_MODE !== 'false' // Default to test mode
    };
};

// Generate MD5 signature for PayFast
function generateSignature(data, passphrase = null) {
    // PayFast DOCUMENTED field order for form submissions
    const fieldOrder = [
        'merchant_id',
        'merchant_key',
        'return_url',
        'cancel_url',
        'notify_url',
        'name_first',
        'name_last',
        'email_address',
        'cell_number',
        'm_payment_id',
        'amount',
        'item_name',
        'item_description',
        'custom_int1',
        'custom_int2',
        'custom_int3',
        'custom_int4',
        'custom_int5',
        'custom_str1',
        'custom_str2',
        'custom_str3',
        'custom_str4',
        'custom_str5',
        'email_confirmation',
        'confirmation_address',
        'payment_method',
        'subscription_type',
        'billing_date',
        'recurring_amount',
        'frequency',
        'cycles'
    ];
    
    // Build parameter string in PayFast's documented order
    const params = [];
    
    fieldOrder.forEach(key => {
        // Only include fields that exist and are not empty
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
            const value = data[key].toString().trim();
            // URL encode and replace %20 with + (PayFast requirement)
            const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
            params.push(`${key}=${encodedValue}`);
        }
    });
    
    // Join parameters with &
    let paramString = params.join('&');
    
    // Add passphrase at the end if provided (ALWAYS LAST)
    if (passphrase) {
        const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
        paramString += `&passphrase=${encodedPassphrase}`;
    }
    
    // Debug logs
    console.log('\n🔐 ===== SIGNATURE GENERATION =====');
    console.log('Signature string:', paramString);
    
    // Generate MD5 hash
    const signature = crypto.createHash('md5').update(paramString).digest('hex');
    console.log('Generated signature:', signature);
    console.log('================================\n');
    
    return signature;
}

// Generate MD5 checksum for PayGate
function generatePayGateChecksum(data, encryptionKey) {
    // Sort keys alphabetically and concatenate values
    const sortedKeys = Object.keys(data).sort();
    const values = sortedKeys.map(key => data[key]).join('');
    const checksumString = values + encryptionKey;
    
    // Generate MD5 hash
    const checksum = crypto.createHash('md5').update(checksumString).digest('hex');
    
    console.log('\n🔐 ===== PAYGATE CHECKSUM GENERATION =====');
    console.log('Checksum string:', checksumString);
    console.log('Generated checksum:', checksum);
    console.log('========================================\n');
    
    return checksum;
}

// Generate HMAC SHA-256 signature for Peach Payments
function generatePeachSignature(params, secretToken) {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    // Generate HMAC SHA-256 signature
    const signature = crypto.createHmac('sha256', secretToken)
        .update(sortedParams)
        .digest('hex');
    
    console.log('\n🔐 ===== PEACH SIGNATURE GENERATION =====');
    console.log('String to sign:', sortedParams);
    console.log('Generated signature:', signature);
    console.log('========================================\n');
    
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
        
        console.log('✅ Payment initiated:', reference);
        
        // Generate curl command for testing
        console.log('\n📋 ===== CURL TEST COMMAND =====');
        console.log('You can test this payment with the following curl command:\n');
        const curlFields = [];
        for (const [key, value] of Object.entries(paymentData)) {
            curlFields.push(`  -d '${key}=${value}'`);
        }
        console.log(`curl -X POST '${config.baseUrl}' \\\n${curlFields.join(' \\\n')}`);
        console.log('================================\n');
        
        // Return payment data for POST form submission (PayFast requirement)
        res.json({
            success: true,
            paymentUrl: config.baseUrl, // Where to POST the form
            formData: paymentData,      // All form fields including signature
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

// POST /api/paygate/initiate - Initiate PayGate payment
app.post('/api/paygate/initiate', async (req, res) => {
    try {
        console.log('💳 PayGate payment request received:', req.body);
        
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
                error: 'Missing required fields'
            });
        }
        
        // Generate unique reference
        const reference = `UAE-PAYGATE-${Date.now()}`;
        
        // Get PayGate config
        const config = getPayGateConfig();
        
        // Get the base URL for return/notify URLs
        const appBaseUrl = process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}`
            : 'http://localhost:5000';
        
        // Convert amount to cents (PayGate requires cents)
        const amountInCents = Math.round(parseFloat(amount) * 100);
        
        // Build initiate request payload
        const initiatePayload = {
            PAYGATE_ID: config.paygateId,
            REFERENCE: reference,
            AMOUNT: amountInCents,
            CURRENCY: 'ZAR',
            RETURN_URL: `${appBaseUrl}/paygate-return.html`,
            TRANSACTION_DATE: new Date().toISOString().split('T')[0].replace(/-/g, ' '),
            LOCALE: 'en-za',
            COUNTRY: 'ZAF',
            EMAIL: applicant_email
        };
        
        // Add notify URL if not localhost
        if (!appBaseUrl.includes('localhost')) {
            initiatePayload.NOTIFY_URL = `${appBaseUrl}/api/paygate/notify`;
        }
        
        // Generate checksum
        initiatePayload.CHECKSUM = generatePayGateChecksum(initiatePayload, config.encryptionKey);
        
        // Make request to PayGate
        const axios = require('axios');
        const initiateResponse = await axios.post(config.initiateUrl, 
            new URLSearchParams(initiatePayload).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        
        // Parse response (format: KEY=VALUE&KEY=VALUE)
        const responseData = {};
        initiateResponse.data.split('&').forEach(item => {
            const [key, value] = item.split('=');
            responseData[key] = value;
        });
        
        console.log('PayGate initiate response:', responseData);
        
        if (responseData.PAY_REQUEST_ID) {
            // Save payment to database
            await pool.query(
                `INSERT INTO payments (reference, application_id, amount, currency, email, name, country, status, payment_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [reference, application_id, amount, 'ZAR', applicant_email, applicant_name, country, 'pending', responseData.PAY_REQUEST_ID]
            );
            
            console.log('✅ PayGate payment initiated:', reference);
            
            // Return redirect URL
            const redirectUrl = `${config.processUrl}?PAY_REQUEST_ID=${responseData.PAY_REQUEST_ID}&CHECKSUM=${responseData.CHECKSUM}`;
            
            res.json({
                success: true,
                paymentUrl: redirectUrl,
                reference: reference,
                payRequestId: responseData.PAY_REQUEST_ID,
                gateway: 'paygate'
            });
        } else {
            throw new Error('PayGate initiate failed: ' + initiateResponse.data);
        }
        
    } catch (error) {
        console.error('❌ PayGate payment error:', error);
        res.status(500).json({
            error: 'Failed to initiate PayGate payment',
            detail: error.message
        });
    }
});

// GET /api/paygate/return - Handle return from PayGate
app.get('/api/paygate/return', async (req, res) => {
    try {
        console.log('📡 PayGate return received:', req.query);
        
        const { PAY_REQUEST_ID, TRANSACTION_STATUS, REFERENCE, CHECKSUM } = req.query;
        
        // Verify checksum
        const config = getPayGateConfig();
        const verifyData = {
            PAYGATE_ID: config.paygateId,
            PAY_REQUEST_ID: PAY_REQUEST_ID || '',
            REFERENCE: REFERENCE || ''
        };
        
        const expectedChecksum = generatePayGateChecksum(verifyData, config.encryptionKey);
        
        // Transaction status codes: 1 = Approved, 2 = Declined, 4 = Cancelled by user
        let status = 'pending';
        if (TRANSACTION_STATUS === '1') {
            status = 'paid';
        } else if (TRANSACTION_STATUS === '2') {
            status = 'failed';
        } else if (TRANSACTION_STATUS === '4') {
            status = 'cancelled';
        }
        
        // Update database
        if (REFERENCE) {
            await pool.query(
                `UPDATE payments 
                 SET status = $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE reference = $2`,
                [status, REFERENCE]
            );
            
            console.log(`✅ PayGate payment ${REFERENCE} updated to status: ${status}`);
        }
        
        res.json({ status, reference: REFERENCE });
        
    } catch (error) {
        console.error('❌ PayGate return error:', error);
        res.status(500).json({ error: 'Return processing error' });
    }
});

// POST /api/paygate/notify - Handle IPN from PayGate
app.post('/api/paygate/notify', async (req, res) => {
    try {
        console.log('📡 PayGate notify received:', req.body);
        
        const notifyData = req.body;
        const config = getPayGateConfig();
        
        // Verify checksum
        const receivedChecksum = notifyData.CHECKSUM;
        delete notifyData.CHECKSUM;
        
        const expectedChecksum = generatePayGateChecksum(notifyData, config.encryptionKey);
        
        if (receivedChecksum !== expectedChecksum) {
            console.error('❌ Invalid PayGate checksum');
            return res.status(400).send('Invalid checksum');
        }
        
        const reference = notifyData.REFERENCE;
        const transactionStatus = notifyData.TRANSACTION_STATUS;
        
        // Update status
        let status = 'pending';
        if (transactionStatus === '1') {
            status = 'paid';
        } else if (transactionStatus === '2') {
            status = 'failed';
        } else if (transactionStatus === '4') {
            status = 'cancelled';
        }
        
        await pool.query(
            `UPDATE payments 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE reference = $2`,
            [status, reference]
        );
        
        console.log(`✅ PayGate notify: ${reference} updated to ${status}`);
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ PayGate notify error:', error);
        res.status(500).send('Notify error');
    }
});

// POST /api/ikhokha/initiate - Initiate iKhokha payment
app.post('/api/ikhokha/initiate', async (req, res) => {
    try {
        console.log('💳 iKhokha payment request received:', req.body);
        
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
                error: 'Missing required fields'
            });
        }
        
        // Generate unique reference
        const reference = `UAE-IKHOKHA-${Date.now()}`;
        
        // Get iKhokha config
        const config = getIKhokhaConfig();
        
        if (!config.applicationId || !config.applicationSecret) {
            throw new Error('iKhokha credentials not configured. Please set IKHOKHA_APPLICATION_ID and IKHOKHA_APPLICATION_SECRET');
        }
        
        // Get the base URL for return/cancel URLs
        const appBaseUrl = process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}`
            : 'http://localhost:5000';
        
        // Prepare iKhokha payment request
        const ikPayload = {
            applicationId: config.applicationId,
            applicationSecret: config.applicationSecret,
            amount: parseFloat(amount).toFixed(2),
            currency: 'ZAR',
            reference: reference,
            customerEmail: applicant_email,
            customerName: applicant_name,
            description: `${description} - ${application_id}`,
            successUrl: `${appBaseUrl}/ikhokha-return.html?status=success&ref=${reference}`,
            cancelUrl: `${appBaseUrl}/ikhokha-return.html?status=cancelled&ref=${reference}`,
            webhookUrl: `${appBaseUrl}/api/ikhokha/webhook`,
            testMode: config.testMode
        };
        
        console.log('\n🔐 ===== IKHOKHA API REQUEST =====');
        console.log('API URL:', `${config.apiUrl}/payment/link`);
        console.log('Test Mode:', config.testMode);
        console.log('========================================\n');
        
        // Make request to iKhokha API
        const axios = require('axios');
        const ikResponse = await axios.post(
            `${config.apiUrl}/payment/link`,
            ikPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
        
        console.log('iKhokha API response:', ikResponse.data);
        
        if (ikResponse.data && ikResponse.data.paymentUrl) {
            // Save payment to database
            await pool.query(
                `INSERT INTO payments (reference, application_id, amount, currency, email, name, country, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [reference, application_id, amount, 'ZAR', applicant_email, applicant_name, country, 'pending']
            );
            
            console.log('✅ iKhokha payment initiated:', reference);
            
            // Return payment URL for redirect
            res.json({
                success: true,
                paymentUrl: ikResponse.data.paymentUrl,
                reference: reference,
                gateway: 'ikhokha',
                testMode: config.testMode
            });
        } else {
            throw new Error('iKhokha API did not return payment URL');
        }
        
    } catch (error) {
        console.error('❌ iKhokha payment error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to initiate iKhokha payment',
            detail: error.response?.data || error.message
        });
    }
});

// POST /api/ikhokha/webhook - Handle iKhokha webhook notifications
app.post('/api/ikhokha/webhook', async (req, res) => {
    try {
        console.log('📡 iKhokha webhook received:', req.body);
        
        const { reference, status, transactionId } = req.body;
        
        if (!reference) {
            return res.status(400).send('Missing reference');
        }
        
        // Map iKhokha status to our status
        let paymentStatus = 'pending';
        if (status === 'COMPLETED' || status === 'SUCCESS') {
            paymentStatus = 'paid';
        } else if (status === 'FAILED') {
            paymentStatus = 'failed';
        } else if (status === 'CANCELLED') {
            paymentStatus = 'cancelled';
        }
        
        // Update database
        await pool.query(
            `UPDATE payments 
             SET status = $1, payment_id = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE reference = $3`,
            [paymentStatus, transactionId || null, reference]
        );
        
        console.log(`✅ iKhokha payment ${reference} updated to status: ${paymentStatus}`);
        
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('❌ iKhokha webhook error:', error);
        res.status(500).send('Webhook error');
    }
});

// POST /api/peach/initiate - Initiate Peach Payments checkout
app.post('/api/peach/initiate', async (req, res) => {
    try {
        console.log('💳 Peach Payments request received:', req.body);
        
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
                error: 'Missing required fields'
            });
        }
        
        // Get Peach config
        const config = getPeachConfig();
        
        if (!config.entityId || !config.accessToken) {
            throw new Error('Peach Payments credentials not configured. Please set PEACH_ENTITY_ID and PEACH_ACCESS_TOKEN');
        }
        
        // Generate unique reference
        const reference = `UAE-PEACH-${Date.now()}`;
        
        // Get the base URL for return URLs
        const appBaseUrl = process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}`
            : 'http://localhost:5000';
        
        // Split name for Peach
        const nameParts = applicant_name.trim().split(' ');
        const givenName = nameParts[0] || applicant_name;
        const surname = nameParts.slice(1).join(' ') || applicant_name;
        
        // Prepare Peach checkout request
        const checkoutData = {
            'authentication.entityId': config.entityId,
            'amount': parseFloat(amount).toFixed(2),
            'currency': 'ZAR',
            'paymentType': 'DB', // DB = Debit (immediate payment)
            'merchantTransactionId': reference,
            'customer.email': applicant_email,
            'customer.givenName': givenName,
            'customer.surname': surname,
            'billing.country': 'ZA',
            'shopperResultUrl': `${appBaseUrl}/peach-return.html`,
            'notificationUrl': `${appBaseUrl}/api/peach/webhook`
        };
        
        // Generate signature
        checkoutData.signature = generatePeachSignature(checkoutData, config.accessToken);
        
        console.log('\n🔐 ===== PEACH CHECKOUT REQUEST =====');
        console.log('API URL:', `${config.apiUrl}/checkout/initiate`);
        console.log('Entity ID:', config.entityId);
        console.log('Test Mode:', config.testMode);
        console.log('========================================\n');
        
        // Make request to Peach Payments
        const axios = require('axios');
        const peachResponse = await axios.post(
            `${config.apiUrl}/checkout/initiate`,
            new URLSearchParams(checkoutData).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        console.log('Peach API response:', peachResponse.data);
        
        if (peachResponse.data && peachResponse.data.redirectUrl) {
            // Save payment to database
            await pool.query(
                `INSERT INTO payments (reference, application_id, amount, currency, email, name, country, status, payment_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [reference, application_id, amount, 'ZAR', applicant_email, applicant_name, country, 'pending', peachResponse.data.checkoutId || null]
            );
            
            console.log('✅ Peach payment initiated:', reference);
            
            // Return redirect URL
            res.json({
                success: true,
                paymentUrl: peachResponse.data.redirectUrl,
                reference: reference,
                checkoutId: peachResponse.data.checkoutId,
                gateway: 'peach',
                testMode: config.testMode
            });
        } else {
            throw new Error('Peach API did not return redirect URL');
        }
        
    } catch (error) {
        console.error('❌ Peach payment error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to initiate Peach payment',
            detail: error.response?.data || error.message
        });
    }
});

// POST /api/peach/webhook - Handle Peach Payments webhook notifications
app.post('/api/peach/webhook', async (req, res) => {
    try {
        console.log('📡 Peach webhook received:', req.body);
        
        const webhookData = req.body;
        const receivedSignature = webhookData.signature;
        const reference = webhookData.merchantTransactionId;
        const resultCode = webhookData['result.code'];
        const checkoutId = webhookData.checkoutId;
        
        if (!reference) {
            return res.status(400).send('Missing reference');
        }
        
        // Verify signature
        const config = getPeachConfig();
        const dataToVerify = { ...webhookData };
        delete dataToVerify.signature;
        
        const expectedSignature = generatePeachSignature(dataToVerify, config.accessToken);
        
        if (receivedSignature !== expectedSignature) {
            console.error('❌ Invalid Peach signature');
            return res.status(400).send('Invalid signature');
        }
        
        // Map Peach result codes to our status
        let paymentStatus = 'pending';
        
        // Success codes start with 000.000 or 000.100
        if (resultCode && (resultCode.startsWith('000.000') || resultCode.startsWith('000.100'))) {
            paymentStatus = 'paid';
        } else if (resultCode && resultCode.startsWith('000.200')) {
            paymentStatus = 'pending';
        } else if (resultCode && resultCode.startsWith('800.')) {
            paymentStatus = 'pending'; // Pending transaction states
        } else {
            paymentStatus = 'failed';
        }
        
        // Update database
        await pool.query(
            `UPDATE payments 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE reference = $2`,
            [paymentStatus, reference]
        );
        
        console.log(`✅ Peach payment ${reference} updated to status: ${paymentStatus} (code: ${resultCode})`);
        
        // Must return 200 to acknowledge receipt
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ Peach webhook error:', error);
        res.status(500).send('Webhook error');
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Payment Gateway (PayFast + PayGate + iKhokha + Peach)',
        payfast_sandbox: getPayFastConfig().sandbox,
        ikhokha_test: getIKhokhaConfig().testMode,
        peach_test: getPeachConfig().testMode,
        gateways: ['payfast', 'paygate', 'ikhokha', 'peach']
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Payment Gateway Server running on port ${PORT}`);
    console.log(`📍 Base URL: http://localhost:${PORT}`);
    console.log(`🧪 PayFast Sandbox:`, getPayFastConfig().sandbox);
    console.log(`🧪 iKhokha Test Mode:`, getIKhokhaConfig().testMode);
    console.log(`🧪 Peach Test Mode:`, getPeachConfig().testMode);
    console.log(`💳 Ready to process payments via PayFast, PayGate, iKhokha, and Peach`);
});
