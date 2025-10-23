// Payment handling script
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
        paymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        hideMessages();
        
        try {
            // Call backend payment API
            const response = await fetch('https://workspace.duane16.repl.co/api/payments/start', {
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
            
            if (data.paymentLink) {
                showSuccess('Redirecting to secure payment gateway...');
                
                // Redirect to payment link after a short delay
                setTimeout(() => {
                    window.location.href = data.paymentLink;
                }, 1500);
            } else {
                throw new Error('No payment link received from server');
            }
            
        } catch (error) {
            console.error('Payment error:', error);
            showError('Payment initiation failed: ' + error.message);
            
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
    
    function hideMessages() {
        const errorDiv = document.getElementById('paymentError');
        const successDiv = document.getElementById('paymentSuccess');
        
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }
});
