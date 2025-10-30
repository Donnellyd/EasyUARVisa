// Initialize Dubai Visa Portal SDK
const sdk = new DubaiVisaPortalSDK({
    apiBaseUrl: 'https://dubai-visa-ai-duane16.replit.app',
    onError: (error) => {
        console.error('SDK Error:', error);
    },
    onSuccess: (message) => {
        console.log('SDK Success:', message);
    }
});

// Visa Application Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('visaApplicationForm');
    const visaTypeSelect = document.getElementById('visaType');
    const processingTimeSelect = document.getElementById('processingTime');
    const visaFeeElement = document.getElementById('visaFee');
    const serviceFeeElement = document.getElementById('serviceFee');
    const totalFeeElement = document.getElementById('totalFee');
    const saveProgressBtn = document.getElementById('saveProgress');
    
    // Visa type mapping for SDK
    const visaTypeMapping = {
        'single-30': 'single-entry-30',
        'multiple-30': 'multiple-entry-30',
        'single-60': 'single-entry-60',
        'multiple-60': 'multiple-entry-60'
    };
    
    // Visa fees in AED
    const visaBaseFees = {
        'single-30': 636,
        'multiple-30': 1203,
        'single-60': 1031,
        'multiple-60': 1980
    };
    
    // Processing fees
    const processingFees = {
        'standard': 100,
        'express': 200,
        'urgent': 300
    };
    
    // Service fee (fixed)
    const serviceFee = 50;
    
    // Exchange rates cache
    let exchangeRates = {};
    let ratesLastFetched = null;
    
    // Store uploaded files
    const uploadedFiles = {
        passport: null,
        photo: null,
        airline: null,
        hotel: null
    };
    
    // Load saved progress if exists
    loadSavedProgress();
    
    // Fetch exchange rates on load
    fetchExchangeRates();
    
    // Calculate fees when selections change
    visaTypeSelect?.addEventListener('change', calculateFees);
    processingTimeSelect?.addEventListener('change', calculateFees);
    
    // Save progress button
    saveProgressBtn?.addEventListener('click', saveProgress);
    
    // Form submission handler - NOW SUBMITS TO BACKEND
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('Form submitted');
        
        // Validate form
        if (!validateForm()) {
            console.log('Validation failed');
            return;
        }
        
        console.log('Validation passed');
        
        // Disable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        try {
            // Collect form data
            const formData = collectFormData();
            
            // Calculate total fee in cents (SDK expects cents)
            const totalFeeAED = calculateTotalFee();
            const visaFeeAED = parseFloat(visaFeeElement.textContent.replace('AED ', '').replace(',', ''));
            const processingFeeAED = processingFees[formData.processingTime] || 0;
            
            // Prepare application data for SDK
            const applicationData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                nationality: formData.country || 'Not Specified', // Use country as nationality fallback
                email: formData.email,
                phone: formData.phone || '',
                passportNumber: formData.passportNumber,
                passportIssueDate: formData.passportIssueDate,
                passportExpiryDate: formData.passportExpiryDate,
                passportPlaceOfIssue: formData.passportPlaceOfIssue || '',
                visaType: visaTypeMapping[formData.visaType] || formData.visaType,
                processingTime: formData.processingTime,
                entryDate: formData.entryDate || '',
                exitDate: formData.exitDate || '',
                applicationFee: Math.round(visaFeeAED * 100), // Convert to cents
                serviceFee: Math.round(processingFeeAED * 100), // Processing fee goes here
                totalAmount: Math.round(totalFeeAED * 100) // Total in cents
            };
            
            console.log('Submitting application:', applicationData);
            
            let applicationNumber;
            let useLocalStorage = false;
            
            try {
                // Try to submit application via SDK (backend)
                const result = await sdk.submitApplication(applicationData);
                
                console.log('Application submitted successfully to backend:', result);
                
                // Get the application ID and number from response
                const applicationId = result.application.id;
                applicationNumber = result.application.applicationNumber;
                
                // Upload documents if any files were selected
                await uploadDocuments(applicationId);
                
            } catch (backendError) {
                console.warn('Backend submission failed, using localStorage fallback:', backendError);
                
                // Backend failed - fall back to localStorage
                useLocalStorage = true;
                applicationNumber = generateLocalReferenceNumber();
                
                // Save to localStorage
                const localApplication = {
                    ...applicationData,
                    applicationNumber: applicationNumber,
                    submittedAt: new Date().toISOString(),
                    status: 'pending',
                    source: 'local'
                };
                
                saveApplicationToLocalStorage(localApplication);
                
                console.log('Application saved locally with reference:', applicationNumber);
                
                // Show info message about offline mode
                showNotification('Application saved locally. It will sync when connection is restored.', 'info');
            }
            
            // Show success modal with reference number (from backend or local)
            showSuccessModal(applicationNumber, totalFeeAED);
            
            // Clear saved progress
            clearSavedProgress();
            
            // Reset form
            form.reset();
            calculateFees();
            
            // Clear uploaded files
            Object.keys(uploadedFiles).forEach(key => uploadedFiles[key] = null);
            
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('Error submitting application: ' + error.message + '\n\nPlease try again or contact support.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
    
    async function uploadDocuments(applicationId) {
        const documentsToUpload = [];
        
        // Map uploaded files to document types
        if (uploadedFiles.passport) {
            documentsToUpload.push({ file: uploadedFiles.passport, type: 'passport' });
        }
        if (uploadedFiles.photo) {
            documentsToUpload.push({ file: uploadedFiles.photo, type: 'photo' });
        }
        if (uploadedFiles.airline) {
            documentsToUpload.push({ file: uploadedFiles.airline, type: 'ticket' });
        }
        if (uploadedFiles.hotel) {
            documentsToUpload.push({ file: uploadedFiles.hotel, type: 'hotel' });
        }
        
        if (documentsToUpload.length === 0) {
            console.log('No documents to upload');
            return;
        }
        
        console.log(`Uploading ${documentsToUpload.length} documents...`);
        
        try {
            // Upload documents using SDK
            await sdk.uploadDocuments(applicationId, documentsToUpload, (progress) => {
                console.log(`Upload progress: ${progress.percentage}% - ${progress.filename}`);
            });
            
            console.log('All documents uploaded successfully');
        } catch (error) {
            console.error('Error uploading documents:', error);
            // Don't fail the whole submission if documents fail
            alert('Application submitted but some documents failed to upload. You can upload them later.');
        }
    }
    
    function calculateFees() {
        const visaType = visaTypeSelect?.value;
        const processingTime = processingTimeSelect?.value;
        
        let visaFee = 0;
        
        if (visaType && visaBaseFees[visaType]) {
            visaFee = visaBaseFees[visaType];
        }
        
        // Get processing fee
        const processingFee = processingTime && processingFees[processingTime] ? processingFees[processingTime] : 0;
        
        // Calculate total
        const total = visaFee + processingFee + serviceFee;
        
        // Update display (AED currency only)
        if (visaFeeElement) {
            visaFeeElement.textContent = 'AED ' + visaFee.toFixed(2);
        }
        if (serviceFeeElement) {
            serviceFeeElement.textContent = 'AED ' + serviceFee.toFixed(2);
        }
        if (totalFeeElement) {
            totalFeeElement.textContent = 'AED ' + total.toFixed(2);
        }
    }
    
    function calculateTotalFee() {
        const text = totalFeeElement.textContent;
        const aedMatch = text.match(/AED\s+([\d,.]+)/);
        if (aedMatch) {
            return parseFloat(aedMatch[1].replace(',', ''));
        }
        return 0;
    }
    
    function validateForm() {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            const errorElement = document.getElementById(field.id + '-error');
            
            if (!field.value.trim()) {
                if (errorElement) {
                    errorElement.textContent = 'This field is required';
                    errorElement.style.display = 'block';
                }
                field.style.borderColor = '#dc3545';
                isValid = false;
            } else {
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
                field.style.borderColor = '';
            }
        });
        
        // Validate passport expiry (must be at least 6 months from now)
        const passportExpiry = document.getElementById('passportExpiryDate')?.value;
        if (passportExpiry) {
            const expiryDate = new Date(passportExpiry);
            const sixMonthsFromNow = new Date();
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
            
            if (expiryDate < sixMonthsFromNow) {
                const errorElement = document.getElementById('passportExpiryDate-error');
                if (errorElement) {
                    errorElement.textContent = 'Passport must be valid for at least 6 months';
                    errorElement.style.display = 'block';
                }
                document.getElementById('passportExpiryDate').style.borderColor = '#dc3545';
                isValid = false;
            }
        }
        
        if (!isValid) {
            const firstError = form.querySelector('[style*="border-color: rgb(220, 53, 69)"]');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        return isValid;
    }
    
    function collectFormData() {
        const formData = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.name) {
                formData[input.name] = input.value;
            } else if (input.id) {
                formData[input.id] = input.value;
            }
        });
        
        return formData;
    }
    
    function showSuccessModal(reference, totalFee) {
        console.log('Showing modal with reference:', reference, 'fee:', totalFee);
        
        // Get applicant details for payment page - trim individual fields to prevent spacing issues
        const firstName = (document.getElementById('firstName')?.value || '').trim();
        const lastName = (document.getElementById('lastName')?.value || '').trim();
        const applicantName = `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ');
        const applicantEmail = (document.getElementById('email')?.value || '').trim();
        const country = (document.getElementById('country')?.value || '').trim();
        
        // Update modal content
        document.getElementById('applicationRef').textContent = reference;
        
        const modalFeeElement = document.getElementById('modalTotalFee');
        if (modalFeeElement) {
            modalFeeElement.textContent = 'AED ' + totalFee.toFixed(2);
        }
        
        // Show modal using Bootstrap
        const modalElement = document.getElementById('successModal');
        if (modalElement && typeof bootstrap !== 'undefined') {
            const successModal = new bootstrap.Modal(modalElement);
            successModal.show();
            console.log('Modal displayed');
            
            // Redirect to payment page after 3 seconds
            setTimeout(() => {
                redirectToPayment(reference, applicantName, applicantEmail, totalFee, country);
            }, 3000);
        } else {
            console.error('Bootstrap or modal element not found');
            // Redirect immediately if modal doesn't work
            redirectToPayment(reference, applicantName, applicantEmail, totalFee, country);
        }
    }
    
    function redirectToPayment(reference, name, email, amount, country) {
        const paymentUrl = `payment.html?ref=${encodeURIComponent(reference)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&amount=${encodeURIComponent(amount)}&country=${encodeURIComponent(country)}`;
        console.log('Redirecting to payment:', paymentUrl);
        window.location.href = paymentUrl;
    }
    
    function saveProgress() {
        const formData = collectFormData();
        localStorage.setItem('visa_application_progress', JSON.stringify(formData));
        showNotification('Progress saved successfully!', 'success');
    }
    
    function loadSavedProgress() {
        const savedData = localStorage.getItem('visa_application_progress');
        
        if (savedData) {
            const formData = JSON.parse(savedData);
            
            Object.keys(formData).forEach(key => {
                const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                // Skip file inputs - browsers don't allow setting file input values programmatically
                if (field && formData[key] && field.type !== 'file') {
                    field.value = formData[key];
                }
            });
            
            calculateFees();
            showNotification('Previous progress restored', 'info');
        }
    }
    
    function clearSavedProgress() {
        localStorage.removeItem('visa_application_progress');
    }
    
    function generateLocalReferenceNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `UAE-${year}${month}${day}-${random}`;
    }
    
    function saveApplicationToLocalStorage(application) {
        const applications = getLocalApplications();
        applications.push(application);
        localStorage.setItem('visa_applications', JSON.stringify(applications));
    }
    
    function getLocalApplications() {
        const data = localStorage.getItem('visa_applications');
        return data ? JSON.parse(data) : [];
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00732e' : '#0066cc'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // File upload handlers - Store files for later upload
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const uploadItem = e.target.closest('.upload-item');
            const fileInfo = uploadItem.querySelector('.file-info');
            const inputName = e.target.name;
            
            if (file) {
                // Store file for upload after form submission
                uploadedFiles[inputName] = file;
                
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                fileInfo.innerHTML = `
                    <div class="file-selected">
                        <i class="fas fa-check-circle"></i>
                        <span>${file.name} (${fileSize} MB)</span>
                    </div>
                `;
                fileInfo.style.display = 'block';
                uploadItem.classList.add('uploaded');
            }
        });
    });
    
    // Fetch exchange rates from API
    async function fetchExchangeRates() {
        try {
            const now = new Date().getTime();
            if (ratesLastFetched && (now - ratesLastFetched < 24 * 60 * 60 * 1000)) {
                return;
            }
            
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/AED');
            if (!response.ok) throw new Error('Failed to fetch rates');
            
            const data = await response.json();
            exchangeRates = data.rates;
            ratesLastFetched = now;
            
            console.log('Exchange rates loaded successfully');
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
        }
    }
    
    // Currency Converter Calculator
    const converterAmount = document.getElementById('converterAmount');
    const converterCurrency = document.getElementById('converterCurrency');
    const converterResult = document.getElementById('converterResult');
    
    function updateConverterResult() {
        const amount = parseFloat(converterAmount?.value) || 0;
        const currency = converterCurrency?.value;
        
        if (!currency || !amount) {
            converterResult.textContent = 'Select currency to see conversion';
            converterResult.style.color = '#666';
            return;
        }
        
        if (!exchangeRates[currency]) {
            converterResult.textContent = 'Exchange rate not available';
            converterResult.style.color = '#dc3545';
            return;
        }
        
        const rate = exchangeRates[currency];
        const converted = (amount * rate).toFixed(2);
        
        const symbols = {
            'ZAR': 'R', 'BWP': 'P', 'NAD': 'N$', 'TZS': 'TSh',
            'ZMW': 'ZK', 'MZN': 'MT', 'USD': '$', 'MWK': 'MK',
            'MGA': 'Ar', 'KMF': 'CF', 'LSL': 'L', 'SZL': 'E'
        };
        
        const symbol = symbols[currency] || '';
        converterResult.textContent = `${symbol}${converted}`;
        converterResult.style.color = '#00732e';
    }
    
    converterAmount?.addEventListener('input', updateConverterResult);
    converterCurrency?.addEventListener('change', updateConverterResult);
    
    // Initial calculation
    calculateFees();
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .file-selected {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: #e8f5e9;
        border-radius: 4px;
        color: #00732e;
    }
`;
document.head.appendChild(style);
