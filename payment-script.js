// Payment handling script with enhanced debugging and retry logic

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

document.addEventListener('DOMContentLoaded', function() {
    const paymentForm = document.getElementById('paymentForm');
    const paymentBtn = document.getElementById('paymentBtn');
    
    // Get payment data from URL parameters
    loadPaymentDetails();
    
    // Handle payment form submission
    paymentForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const applicationId = document.getElementById('applicationId').value;
        const applicantName = document.getElementById('applicantName').value;
        const applicantEmail = document.getElementById('applicantEmail').value;
        const amount = document.getElementById('amount').value;
        const country = document.getElementById('country').value;
        
        if (!applicationId || !applicantName || !applicantEmail || !amount || !country) {
            showError('Please fill in all required fields');
            return;
        }
        
        // Disable button and show loading
        const originalBtnText = paymentBtn.innerHTML;
        paymentBtn.disabled = true;
        paymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
        
        hideMessages();
        
        // Stage 1: Initiating payment
        logStage('init');
        
        const backendURL = 'https://workspace.duane16.repl.co/api/payments/start';
        
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
                    amount: parseFloat(amount),
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
            
            if (data.paymentLink) {
                // Show success modal
                showSuccessModal('Payment initiated successfully! Redirecting to secure payment gateway...');
                
                // Redirect to payment link after a short delay
                setTimeout(() => {
                    window.location.href = data.paymentLink;
                }, 2000);
            } else {
                throw new Error('No payment link received from server');
            }
            
        } catch (error) {
            // Stage 4: Error
            logStage('error');
            
            // Enhanced error logging
            logPaymentError(error, backendURL);
            
            // Determine error type and create helpful message
            let errorDetails = '';
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                errorDetails = 'Cannot connect to payment backend at workspace.duane16.repl.co. The server may be sleeping or offline.';
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
        
        // Display details
        document.getElementById('displayApplicationId').textContent = applicationId;
        document.getElementById('displayApplicantName').textContent = applicantName;
        document.getElementById('displayApplicantEmail').textContent = applicantEmail;
        document.getElementById('displayAmount').textContent = 'AED ' + parseFloat(amount).toFixed(2);
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
                    <li>Click <a href="https://workspace.duane16.repl.co" target="_blank" style="color: #c8102e;" onclick="startWakeCountdown()">this link</a> to wake up the backend server</li>
                    <li>Wait for the 60-second countdown to complete</li>
                    <li>Click "Try Payment Again" to retry</li>
                </ol>
                <div id="countdownDisplay" style="display: none; margin-top: 1rem; padding: 1rem; background: #f0f0f0; border-radius: 8px;">
                    <p style="margin: 0; font-size: 0.9rem; color: #333;">
                        <i class="fas fa-clock"></i> Backend is waking up... 
                        <span id="countdownSeconds" style="font-weight: bold; color: #c8102e;">60</span> seconds remaining
                    </p>
                </div>
            `;
            fallbackMessage.innerHTML = messageHTML;
        }
        
        // Show the fallback UI
        const fallbackUI = document.getElementById('fallbackUI');
        if (fallbackUI) {
            fallbackUI.style.display = 'block';
        }
    }
    
    // Start 60-second countdown
    window.startWakeCountdown = function() {
        const countdownDisplay = document.getElementById('countdownDisplay');
        const countdownSeconds = document.getElementById('countdownSeconds');
        const retryButton = document.querySelector('#fallbackUI button[onclick="retryPayment()"]');
        
        if (countdownDisplay) {
            countdownDisplay.style.display = 'block';
        }
        
        // Disable retry button during countdown
        if (retryButton) {
            retryButton.disabled = true;
            retryButton.style.opacity = '0.5';
            retryButton.style.cursor = 'not-allowed';
        }
        
        let seconds = 60;
        
        // Clear any existing countdown
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        countdownInterval = setInterval(() => {
            seconds--;
            if (countdownSeconds) {
                countdownSeconds.textContent = seconds;
            }
            
            if (seconds <= 0) {
                clearInterval(countdownInterval);
                
                // Update countdown message
                if (countdownDisplay) {
                    countdownDisplay.innerHTML = `
                        <p style="margin: 0; font-size: 0.9rem; color: #22c55e;">
                            <i class="fas fa-check-circle"></i> Backend should be ready! You can now retry payment.
                        </p>
                    `;
                }
                
                // Re-enable retry button
                if (retryButton) {
                    retryButton.disabled = false;
                    retryButton.style.opacity = '1';
                    retryButton.style.cursor = 'pointer';
                }
            }
        }, 1000);
    };
    
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
