/**
 * Payment Routes
 * Handles all payment-related endpoints
 */

const express = require('express');
const router = express.Router();
const { generateSignature } = require('../utils/signature');
const { getPayFastConfig } = require('../config/payfast');

/**
 * Initialize payment routes with database pool
 * @param {Pool} pool - PostgreSQL connection pool
 */
function createPaymentRoutes(pool) {
    
    // POST /api/payments/start - Initiate PayFast payment
    router.post('/start', async (req, res) => {
        try {
            console.log('💳 Payment request received:', req.body);
            
            const {
                application_id,
                applicant_name,
                applicant_email,
                amount,
                country,
                description = 'Payment'
            } = req.body;
            
            // Validation
            if (!application_id || !applicant_name || !applicant_email || !amount) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    required: ['application_id', 'applicant_name', 'applicant_email', 'amount']
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
            const reference = `PAY-${Date.now()}`;
            
            // Get PayFast config
            const config = getPayFastConfig();
            
            // Get the base URL for return/cancel/notify URLs
            const appBaseUrl = process.env.APP_BASE_URL 
                || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000');
            
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
                return_url: `${appBaseUrl}/payment-success?ref=${reference}&application_id=${application_id}`,
                cancel_url: `${appBaseUrl}/payment-cancelled?ref=${reference}`,
                notify_url: `${appBaseUrl}/api/payments/verify`,
                
                // Custom fields (optional - adjust as needed)
                custom_str1: application_id,
                custom_str2: country || 'Unknown'
            };
            
            // Generate signature
            paymentData.signature = generateSignature(paymentData, config.passphrase);
            
            // Save payment to database
            await pool.query(
                `INSERT INTO payments (reference, application_id, amount, currency, email, name, country, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [reference, application_id, amount, 'ZAR', cleanEmail, cleanName, country, 'pending']
            );
            
            console.log('✅ Payment initiated:', reference);
            
            // Return payment data for POST form submission (PayFast requirement)
            res.json({
                success: true,
                paymentUrl: config.baseUrl,
                formData: paymentData,
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
    router.post('/verify', async (req, res) => {
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
            
            // Map PayFast status to our status
            let status = 'pending';
            if (paymentStatus === 'COMPLETE') {
                status = 'paid';
            } else if (paymentStatus === 'FAILED') {
                status = 'failed';
            } else if (paymentStatus === 'CANCELLED') {
                status = 'cancelled';
            }
            
            // Update database
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
    router.get('/status/:reference', async (req, res) => {
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
    
    return router;
}

module.exports = { createPaymentRoutes };
