/**
 * PayFast Signature Generation Utility
 * Generates MD5 signatures following PayFast's documented specification
 */

const crypto = require('crypto');

/**
 * Generate MD5 signature for PayFast requests
 * @param {Object} data - Payment data object
 * @param {string|null} passphrase - Optional passphrase for additional security
 * @returns {string} MD5 signature
 */
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
    
    // Debug logs (comment out in production for security)
    console.log('\n🔐 ===== SIGNATURE GENERATION =====');
    console.log('Signature string:', paramString);
    
    // Generate MD5 hash
    const signature = crypto.createHash('md5').update(paramString).digest('hex');
    console.log('Generated signature:', signature);
    console.log('================================\n');
    
    return signature;
}

module.exports = { generateSignature };
