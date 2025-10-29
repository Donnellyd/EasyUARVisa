// Payment handling script with PayFast integration

// Enhanced error logging function
function logPaymentError(error, backendURL) {
    console.group('💳 PAYMENT DEBUG INFO');
    console.error('Message:', error.message);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    console.error('Type:', error.constructor.name);
    console.error('Backend URL:', backendURL);
    console.groupEnd();
}

// Stage tracking with emojis
function logStage(stage, details = '') {
    const stages = {
        'init': '🔄 Initiating payment...',
        'calling': '📡 Calling backend at:',
        'success': '✅ Backend response received',
        'error': '⚠️ Backend unreachable — likely sleeping',
        'wake': '💤 Suggesting wake-up link to user',
        'retry': '🔁 Retrying payment after backend wake'
    };
    
    if (details) {
        console.info(stages[stage], details);
    } else {
        console.info(stages[stage]);
    }
}

let countdownInterval = null;

// Exchange rates cache
let exchangeRates = {};

// Fetch exchange rates for currency conversion
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/AED');
        if (!response.ok) throw new Error('Failed to fetch rates');
        
        const data = await response.json();
        exchangeRates = data.rates;
        console.log('Exchange rates loaded for payment conversion');
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback rate for ZAR if API fails
        exchangeRates = { 'ZAR': 4.8 };
    }
}

// Function to create and submit POST form to PayFast
function submitPayFastForm(paymentUrl, formData) {
    console.log('📝 Creating POST form for PayFast submission...');
    console.log('Payment URL:', paymentUrl);
    console.log('Form Data:', formData);
    
    // Create a form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentUrl;
    
    // Add all form fields as hidden inputs
    for (const [key, value] of Object.entries(formData)) {
        if (value !== '' && value !== null && value !== undefined) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
            console.log(`  ✓ ${key}: ${value}`);
        }
    }
    
    // Add form to page (required for submission)
    document.body.appendChild(form);
    
    console.log('🚀 Submitting form to PayFast...');
    
    // Submit the form
    form.submit();
}

document.addEventListener('DOMContentLoaded', async function() {
    const paymentForm = document.getElementById('paymentForm');
    const paymentBtn = document.getElementById('paymentBtn');
    
    // Load exchange rates first
    await fetchExchangeRates();
    
    // Get payment data from URL parameters
    loadPaymentDetails();
    
    // Handle payment form submission
    paymentForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const applicationId = document.getElementById('applicationId').value;
        const applicantName = document.getElementById('applicantName').value;
        const applicantEmail = document.getElementById('applicantEmail').value;
        const aedAmount = parseFloat(document.getElementById('amount').value);
        const country = document.getElementById('country').value;
        const gateway = document.getElementById('paymentGateway').value;
        
        if (!applicationId || !applicantName || !applicantEmail || !aedAmount || !country || !gateway) {
            showError('Please fill in all required fields');
            return;
        }
        
        // Convert AED to ZAR for South Africa (both gateways use ZAR)
        let paymentAmount = aedAmount;
        if (country === 'South Africa' && exchangeRates['ZAR']) {
            paymentAmount = aedAmount * exchangeRates['ZAR'];
            console.log(`💱 Currency conversion: AED ${aedAmount.toFixed(2)} → ZAR ${paymentAmount.toFixed(2)} (Rate: ${exchangeRates['ZAR']})`);
        }
        
        // Disable button and show loading
        const originalBtnText = paymentBtn.innerHTML;
        paymentBtn.disabled = true;
        paymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
        
        hideMessages();
        
        // Stage 1: Initiating payment
        logStage('init');
        
        // Get the current domain for backend URL
        const currentDomain = window.location.origin;
        
        // Choose backend endpoint based on selected gateway
        let backendURL;
        if (gateway === 'paygate') {
            backendURL = `${currentDomain}/api/paygate/initiate`;
        } else if (gateway === 'ikhokha') {
            backendURL = `${currentDomain}/api/ikhokha/initiate`;
        } else {
            backendURL = `${currentDomain}/api/payments/start`;
        }
        
        try {
            // Stage 2: Calling backend
            logStage('calling', backendURL);
            
            // Call backend payment API
            const response = await fetch(backendURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    application_id: applicationId,
                    applicant_name: applicantName,
                    applicant_email: applicantEmail,
                    amount: paymentAmount,
                    country: country,
                    description: 'UAE Visa Application Fee'
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Payment failed' }));
                throw new Error(errorData.error || 'Payment initiation failed');
            }
            
            const data = await response.json();
            
            // Stage 3: Success
            logStage('success');
            
            console.log('Payment initiated:', data);
            
            // Handle different gateway response types
            if (data.gateway === 'paygate') {
                // PayGate: Direct redirect to payment URL
                if (data.paymentUrl) {
                    showSuccessModal('Payment initiated successfully! Redirecting to PayGate...');
                    setTimeout(() => {
                        window.location.href = data.paymentUrl;
                    }, 2000);
                } else {
                    throw new Error('No payment URL received from PayGate');
                }
            } else if (data.gateway === 'ikhokha') {
                // iKhokha: Direct redirect to payment URL
                if (data.paymentUrl) {
                    const testNote = data.testMode ? ' (Test Mode)' : '';
                    showSuccessModal(`Payment initiated successfully!${testNote} Redirecting to iKhokha...`);
                    setTimeout(() => {
                        window.location.href = data.paymentUrl;
                    }, 2000);
                } else {
                    throw new Error('No payment URL received from iKhokha');
                }
            } else if (data.gateway === 'payfast') {
                // PayFast: Submit POST form
                if (data.paymentUrl && data.formData) {
                    const sandboxNote = data.sandbox ? ' (Sandbox Mode - Test Payment)' : '';
                    showSuccessModal(`Payment initiated successfully!${sandboxNote} Redirecting to PayFast...`);
                    setTimeout(() => {
                        submitPayFastForm(data.paymentUrl, data.formData);
                    }, 2000);
                } else {
                    throw new Error('No payment data received from server');
                }
            } else {
                throw new Error('Unknown payment gateway');
            }
            
        } catch (error) {
            // Stage 4: Error
            logStage('error');
            
            // Enhanced error logging
            logPaymentError(error, backendURL);
            
            // Determine error type and create helpful message
            let errorDetails = '';
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                errorDetails = 'Cannot connect to payment backend. The server may be starting up or unavailable.';
            } else if (error.message.includes('NetworkError')) {
                errorDetails = 'Network connection failed. Please check your internet connection.';
            } else {
                errorDetails = error.message;
            }
            
            // Save payment intent to localStorage for later retry
            savePaymentIntent({
                applicationId,
                applicantName,
                applicantEmail,
                amount: parseFloat(amount),
                country
            });
            
            // Stage 5: Show wake-up suggestion
            logStage('wake');
            
            // Show fallback UI with detailed error
            showFallbackOptions(errorDetails);
            
            // Re-enable button
            paymentBtn.disabled = false;
            paymentBtn.innerHTML = originalBtnText;
        }
    });
    
    function loadPaymentDetails() {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        const applicationId = urlParams.get('ref') || urlParams.get('application_id');
        const applicantName = urlParams.get('name');
        const applicantEmail = urlParams.get('email');
        const amount = urlParams.get('amount');
        const country = urlParams.get('country');
        
        if (!applicationId || !applicantName || !applicantEmail || !amount) {
            showError('Missing payment details. Please submit your application first.');
            paymentBtn.disabled = true;
            return;
        }
        
        // Set hidden form fields
        document.getElementById('applicationId').value = applicationId;
        document.getElementById('applicantName').value = applicantName;
        document.getElementById('applicantEmail').value = applicantEmail;
        document.getElementById('amount').value = amount;
        
        // Pre-select country if provided in URL
        const countrySelect = document.getElementById('country');
        if (country && countrySelect) {
            countrySelect.value = country;
        }
        
        // Display details
        document.getElementById('displayApplicationId').textContent = applicationId;
        document.getElementById('displayApplicantName').textContent = applicantName;
        document.getElementById('displayApplicantEmail').textContent = applicantEmail;
        
        // Update amount display
        updateAmountDisplay();
        
        // Add event listener to country dropdown to update amount display
        if (countrySelect) {
            countrySelect.addEventListener('change', updateAmountDisplay);
        }
    }
    
    function updateAmountDisplay() {
        const amount = parseFloat(document.getElementById('amount').value);
        const country = document.getElementById('country').value;
        const displayEl = document.getElementById('displayAmount');
        
        if (!displayEl || !amount) return;
        
        // If South Africa, show ZAR prominently and AED as reference
        if (country === 'South Africa' && exchangeRates['ZAR']) {
            const zarAmount = amount * exchangeRates['ZAR'];
            // ZAR in RED (prominent), AED as small reference text in grey
            displayEl.innerHTML = `<span style="color: #c8102e; font-weight: 700; font-size: 1.5rem;">ZAR ${zarAmount.toFixed(2)}</span> <span style="color: #666; font-size: 0.85rem; font-weight: 400;">(approx. AED ${amount.toFixed(2)})</span>`;
            
            // Add payment notice
            let noticeEl = document.getElementById('currencyNotice');
            if (!noticeEl) {
                noticeEl = document.createElement('div');
                noticeEl.id = 'currencyNotice';
                noticeEl.style.cssText = 'margin-top: 0.5rem; padding: 0.75rem; background: #f0f9ff; border-left: 3px solid #c8102e; font-size: 0.9rem; color: #333;';
                displayEl.parentNode.appendChild(noticeEl);
            }
            noticeEl.innerHTML = `<i class="fas fa-info-circle" style="color: #c8102e;"></i> <strong>You will be charged ZAR ${zarAmount.toFixed(2)}</strong> via PayFast (South African payment gateway)`;
        } else {
            // For other countries, show AED only (in RED)
            displayEl.innerHTML = `<span style="color: #c8102e; font-weight: 700; font-size: 1.5rem;">AED ${amount.toFixed(2)}</span>`;
            
            // Remove currency notice if it exists
            const noticeEl = document.getElementById('currencyNotice');
            if (noticeEl) {
                noticeEl.remove();
            }
        }
    }
    
    function showError(message) {
        const errorDiv = document.getElementById('paymentError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
    
    function showSuccess(message) {
        const successDiv = document.getElementById('paymentSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
    }
    
    function showSuccessModal(message) {
        // Create modal overlay if it doesn't exist
        let modal = document.getElementById('paymentSuccessModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'paymentSuccessModal';
            modal.className = 'payment-modal';
            modal.innerHTML = `
                <div class="payment-modal-content">
                    <div class="payment-modal-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="payment-modal-title">Payment Initiated!</h3>
                    <p class="payment-modal-message"></p>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const messageEl = modal.querySelector('.payment-modal-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        modal.style.display = 'flex';
    }
    
    function hideMessages() {
        const errorDiv = document.getElementById('paymentError');
        const successDiv = document.getElementById('paymentSuccess');
        
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }
    
    function savePaymentIntent(paymentData) {
        // Save payment intent to localStorage
        const pendingPayment = {
            ...paymentData,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        localStorage.setItem('pendingPayment_' + paymentData.applicationId, JSON.stringify(pendingPayment));
    }
    
    function showFallbackOptions(errorDetails) {
        // Hide the main form
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.style.display = 'none';
        }
        
        // Update fallback message with specific error details
        const fallbackMessage = document.getElementById('fallbackMessage');
        if (fallbackMessage && errorDetails) {
            const messageHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Payment System Temporarily Unavailable</h4>
                <p>${errorDetails}</p>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
                    <strong>How to fix:</strong>
                </p>
                <ol style="text-align: left; margin: 1rem auto; max-width: 500px; font-size: 0.9rem; color: #666;">
                    <li>Wait a few seconds for the server to start</li>
                    <li>Click "Try Payment Again" below</li>
                    <li>If the problem persists, contact support</li>
                </ol>
            `;
            fallbackMessage.innerHTML = messageHTML;
        }
        
        // Show the fallback UI
        const fallbackUI = document.getElementById('fallbackUI');
        if (fallbackUI) {
            fallbackUI.style.display = 'block';
        }
    }
    
    // Handle "Try Payment Again" button
    window.retryPayment = function() {
        // Stage 6: Retrying
        logStage('retry');
        
        // Clear countdown
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        // Hide fallback UI
        const fallbackUI = document.getElementById('fallbackUI');
        if (fallbackUI) {
            fallbackUI.style.display = 'none';
        }
        
        // Show form again
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.style.display = 'block';
        }
        
        // Reload the page to reset
        location.reload();
    };
    
    // Handle "Continue Without Payment" button
    window.continueWithoutPayment = function() {
        const applicationId = document.getElementById('applicationId').value;
        const applicantEmail = document.getElementById('applicantEmail').value;
        
        // Show confirmation message
        const fallbackMessage = document.getElementById('fallbackMessage');
        if (fallbackMessage) {
            fallbackMessage.innerHTML = '<i class="fas fa-check-circle"></i> Payment details saved! Redirecting to status tracking...';
            fallbackMessage.className = 'fallback-message success';
        }
        
        // Redirect to status page after 2 seconds
        setTimeout(() => {
            window.location.href = `status.html`;
        }, 2000);
    };
});
