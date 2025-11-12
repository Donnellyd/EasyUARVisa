/**
 * PayFast Configuration
 * Loads and validates PayFast credentials from environment variables
 */

function getPayFastConfig() {
    const config = {
        merchantId: process.env.PAYFAST_MERCHANT_ID || '10000100',
        merchantKey: process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',
        passphrase: process.env.PAYFAST_PASSPHRASE || 'jt7NOE43FZPn',
        sandbox: process.env.PAYFAST_SANDBOX !== 'false',
        baseUrl: process.env.PAYFAST_SANDBOX !== 'false' 
            ? 'https://sandbox.payfast.co.za/eng/process' 
            : 'https://www.payfast.co.za/eng/process'
    };
    
    console.log('🔑 PayFast Config Loaded:');
    console.log(`   Mode: ${config.sandbox ? 'SANDBOX' : 'PRODUCTION'}`);
    console.log(`   Merchant ID: ${config.merchantId}`);
    console.log(`   Merchant Key: ${config.merchantKey.substring(0, 5)}...`);
    console.log(`   Passphrase: ${config.passphrase ? config.passphrase.substring(0, 5) + '...' : 'Not set'}`);
    
    return config;
}

module.exports = { getPayFastConfig };
