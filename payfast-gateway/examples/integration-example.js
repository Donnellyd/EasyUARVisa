/**
 * PayFast Payment Gateway - Integration Example
 * 
 * This example shows how to integrate the PayFast payment gateway
 * into your application (e.g., DubaiVisa AI backend or any other app)
 */

// ============================================
// EXAMPLE 1: Basic Payment Initiation
// ============================================

async function initiatePayment() {
    // Your application data
    const applicationData = {
        id: 'APP-123456',
        fullName: 'John Doe',
        email: 'john@example.com',
        totalAmount: 786.00,
        country: 'South Africa'
    };
    
    // Call your payment gateway
    const gatewayUrl = 'https://your-payfast-gateway.replit.app';
    
    const response = await fetch(`${gatewayUrl}/api/payments/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            application_id: applicationData.id,
            applicant_name: applicationData.fullName,
            applicant_email: applicationData.email,
            amount: applicationData.totalAmount,
            country: applicationData.country,
            description: 'UAE Visa Application Fee'
        })
    });
    
    const paymentData = await response.json();
    
    console.log('Payment initiated:', paymentData.reference);
    
    // Redirect user to PayFast
    redirectToPayFast(paymentData);
}

// ============================================
// EXAMPLE 2: Redirect to PayFast
// ============================================

function redirectToPayFast(paymentData) {
    // Create a hidden form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.paymentUrl; // PayFast URL
    
    // Add all form fields from payment data
    for (const [key, value] of Object.entries(paymentData.formData)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }
    
    // Submit form (redirects to PayFast)
    document.body.appendChild(form);
    form.submit();
}

// ============================================
// EXAMPLE 3: Check Payment Status
// ============================================

async function checkPaymentStatus(reference) {
    const gatewayUrl = 'https://your-payfast-gateway.replit.app';
    
    const response = await fetch(`${gatewayUrl}/api/payments/status/${reference}`);
    const payment = await response.json();
    
    console.log('Payment status:', payment.status);
    
    if (payment.status === 'paid') {
        console.log('✅ Payment successful!');
        console.log('Amount:', payment.amount, payment.currency);
        console.log('PayFast ID:', payment.payment_id);
        
        // Update your application
        await updateApplicationStatus(payment.application_id, 'paid');
    } else if (payment.status === 'failed') {
        console.log('❌ Payment failed');
    } else if (payment.status === 'pending') {
        console.log('⏳ Payment pending');
    }
    
    return payment;
}

// ============================================
// EXAMPLE 4: Express.js Integration (Backend)
// ============================================

// In your DubaiVisa AI backend or any Express app:
const express = require('express');
const app = express();

// Payment initiation endpoint
app.post('/api/applications/:id/payment', async (req, res) => {
    const application = await getApplication(req.params.id);
    
    // Call payment gateway
    const gatewayUrl = process.env.PAYMENT_GATEWAY_URL;
    const response = await fetch(`${gatewayUrl}/api/payments/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            application_id: application.id,
            applicant_name: application.fullName,
            applicant_email: application.email,
            amount: application.totalAmount,
            country: application.country,
            description: 'Visa Application Fee'
        })
    });
    
    const paymentData = await response.json();
    
    // Return payment URL to frontend
    res.json({
        paymentUrl: paymentData.paymentUrl,
        formData: paymentData.formData,
        reference: paymentData.reference
    });
});

// Payment success callback
app.get('/payment-success', async (req, res) => {
    const reference = req.query.ref;
    const applicationId = req.query.application_id;
    
    // Check payment status
    const gatewayUrl = process.env.PAYMENT_GATEWAY_URL;
    const response = await fetch(`${gatewayUrl}/api/payments/status/${reference}`);
    const payment = await response.json();
    
    if (payment.status === 'paid') {
        // Update application
        await updateApplication(applicationId, {
            paymentStatus: 'paid',
            paymentReference: reference,
            paymentId: payment.payment_id
        });
        
        res.send('Payment successful! Your application is being processed.');
    } else {
        res.send('Payment verification pending...');
    }
});

// ============================================
// EXAMPLE 5: React/Frontend Integration
// ============================================

// React component for payment
function PaymentButton({ application }) {
    const handlePayment = async () => {
        try {
            // Call your backend
            const response = await fetch(`/api/applications/${application.id}/payment`, {
                method: 'POST'
            });
            
            const paymentData = await response.json();
            
            // Create form and submit to PayFast
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = paymentData.paymentUrl;
            
            for (const [key, value] of Object.entries(paymentData.formData)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            }
            
            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to initiate payment. Please try again.');
        }
    };
    
    return (
        <button onClick={handlePayment}>
            Pay ZAR {application.totalAmount}
        </button>
    );
}

// ============================================
// EXAMPLE 6: Environment Configuration
// ============================================

// In your application's .env file:
/*
PAYMENT_GATEWAY_URL=https://your-payfast-gateway.replit.app
*/

// In your application code:
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL;

// Health check
async function checkGatewayHealth() {
    const response = await fetch(`${PAYMENT_GATEWAY_URL}/health`);
    const health = await response.json();
    console.log('Gateway status:', health.status);
    console.log('Gateway mode:', health.payfast_mode);
}

// ============================================
// EXAMPLE 7: Error Handling
// ============================================

async function initiatePaymentWithErrorHandling(applicationData) {
    try {
        const gatewayUrl = process.env.PAYMENT_GATEWAY_URL;
        
        const response = await fetch(`${gatewayUrl}/api/payments/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                application_id: applicationData.id,
                applicant_name: applicationData.fullName,
                applicant_email: applicationData.email,
                amount: applicationData.totalAmount,
                country: applicationData.country
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Payment initiation failed');
        }
        
        const paymentData = await response.json();
        return paymentData;
        
    } catch (error) {
        console.error('Payment error:', error.message);
        
        // Fallback: Save payment intent for later
        await savePaymentIntent({
            applicationId: applicationData.id,
            amount: applicationData.totalAmount,
            status: 'pending',
            error: error.message
        });
        
        throw error;
    }
}

// ============================================
// USAGE INSTRUCTIONS
// ============================================

/*

1. DEPLOY THE GATEWAY
   - Copy payfast-gateway folder to a new Repl
   - Follow SETUP.md to configure it
   - Get your gateway URL (e.g., https://payfast-gateway-abc123.replit.app)

2. CONFIGURE YOUR APP
   - Add PAYMENT_GATEWAY_URL to your app's environment variables
   - Point it to your deployed gateway

3. INTEGRATE PAYMENT
   - Use Example 1 to initiate payments
   - Use Example 2 to redirect to PayFast
   - Use Example 3 to check payment status

4. HANDLE CALLBACKS
   - Create a success page that checks payment status
   - Update your application based on payment status

5. TEST
   - Use PayFast sandbox mode first
   - Test with sandbox card: 4000 0000 0000 0002
   - Verify payments appear in your database

6. GO LIVE
   - Set PAYFAST_SANDBOX=false in gateway
   - Update to production PayFast credentials
   - Test with real payment

*/

// ============================================
// HELPER FUNCTIONS (implement these in your app)
// ============================================

async function getApplication(id) {
    // Get application from your database
    // Return: { id, fullName, email, totalAmount, country }
}

async function updateApplicationStatus(id, status) {
    // Update application payment status in your database
}

async function updateApplication(id, updates) {
    // Update application in your database
}

async function savePaymentIntent(intent) {
    // Save failed payment attempt for retry later
}

// Export for use in your app
module.exports = {
    initiatePayment,
    checkPaymentStatus,
    redirectToPayFast,
    initiatePaymentWithErrorHandling
};
