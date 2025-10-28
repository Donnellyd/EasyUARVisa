// PayFast credentials
const PAYFAST_MERCHANT_ID = '10043149';
const PAYFAST_MERCHANT_KEY = 'en0yz0p4dh10f';
const PAYFAST_PASSPHRASE = 'Visatest1245';

// Get current domain for URLs
const getCurrentDomain = () => {
    return window.location.origin;
};

// Generate signature using the SAME logic as backend/server.js
function generateSignature(data, passphrase = null) {
    // Filter out empty values and get keys
    const filteredData = {};
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
            filteredData[key] = data[key].toString().trim();
        }
    });
    
    // Sort keys ALPHABETICALLY (this is what PayFast actually expects)
    const sortedKeys = Object.keys(filteredData).sort();
    
    // Build parameter string with alphabetically sorted fields
    const params = [];
    const includedFields = [];
    
    sortedKeys.forEach(key => {
        const value = filteredData[key];
        // URL encode and replace %20 with + (PayFast requirement)
        const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
        params.push(`${key}=${encodedValue}`);
        includedFields.push({ name: key, value: value, encoded: encodedValue });
    });
    
    // Join parameters with &
    let paramString = params.join('&');
    
    // Add passphrase at the end if provided
    if (passphrase) {
        const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
        paramString += `&passphrase=${encodedPassphrase}`;
        includedFields.push({ name: 'passphrase', value: passphrase, encoded: encodedPassphrase });
    }
    
    // Generate MD5 hash using CryptoJS
    const signature = CryptoJS.MD5(paramString).toString();
    
    return {
        signature,
        paramString,
        includedFields,
        urlEncodedPayload: params.join('&')
    };
}

// Form submission handler
document.getElementById('testForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const applicationId = document.getElementById('applicationId').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const amount = parseFloat(document.getElementById('amount').value).toFixed(2);
    const country = document.getElementById('country').value;
    
    // Generate payment reference
    const reference = `UAE-PAY-${Date.now()}`;
    
    // Get domain for URLs
    const domain = getCurrentDomain();
    
    // Build payment data (matching backend/server.js)
    const paymentData = {
        // Merchant details
        merchant_id: PAYFAST_MERCHANT_ID,
        merchant_key: PAYFAST_MERCHANT_KEY,
        
        // Buyer details
        name_first: firstName,
        name_last: lastName,
        email_address: email,
        
        // Payment details
        m_payment_id: reference,
        amount: amount,
        item_name: 'UAE Visa Application Fee',
        item_description: `UAE Visa Application Fee - ${applicationId}`,
        
        // URLs
        return_url: `${domain}/payment-success.html?ref=${reference}`,
        cancel_url: `${domain}/payment.html?ref=${applicationId}&name=${encodeURIComponent(firstName + ' ' + lastName)}&email=${encodeURIComponent(email)}&amount=${amount}`,
        notify_url: `${domain}/api/payments/verify`,
        
        // Custom fields
        custom_str1: applicationId,
        custom_str2: country
    };
    
    // Generate signature
    const result = generateSignature(paymentData, PAYFAST_PASSPHRASE);
    
    // Display results
    displayResults(result);
});

function displayResults(result) {
    // Show results section
    document.getElementById('results').style.display = 'block';
    
    // Display fields list
    const fieldsList = document.getElementById('fieldsList');
    fieldsList.innerHTML = result.includedFields.map((field, index) => {
        const displayValue = field.name === 'passphrase' ? '***' : field.value;
        return `
            <div class="field-item">
                <span class="field-name">${index + 1}. ${field.name}:</span>
                <span class="field-value">${displayValue}</span>
            </div>
        `;
    }).join('');
    
    // Display signature string
    document.getElementById('signatureString').textContent = result.paramString;
    
    // Display MD5 hash
    document.getElementById('md5Hash').textContent = result.signature;
    
    // Display URL-encoded payload
    document.getElementById('urlEncodedPayload').textContent = result.urlEncodedPayload;
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = '#28a745';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '#000';
        }, 2000);
    }).catch(err => {
        alert('Failed to copy to clipboard');
        console.error('Copy failed:', err);
    });
}
