// Visa Application Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('visaApplicationForm');
    const visaTypeSelect = document.getElementById('visaType');
    const processingTimeSelect = document.getElementById('processingTime');
    const visaFeeElement = document.getElementById('visaFee');
    const serviceFeeElement = document.getElementById('serviceFee');
    const totalFeeElement = document.getElementById('totalFee');
    const saveProgressBtn = document.getElementById('saveProgress');
    
    // Standardized visa fees in AED (same for all nationalities)
    const visaBaseFees = {
        'tourist-30-single': 636,      // AED 636.00
        'tourist-30-multiple': 1203,   // AED 1,203.00
        'tourist-60-single': 1031,     // AED 1,031.00
        'tourist-60-multiple': 1980,   // AED 1,980.00
        'business-30': 1200,           // AED 1,200.00
        'transit-96': 200              // AED 200.00
    };
    
    // Processing fees
    const processingFees = {
        'standard': 100,
        'express': 200,
        'urgent': 300
    };
    
    // Service fee (fixed)
    const serviceFee = 50;
    
    // Country to currency mapping
    const countryCurrencies = {
        'BW': { code: 'BWP', symbol: 'P', name: 'Botswana Pula' },
        'KM': { code: 'KMF', symbol: 'CF', name: 'Comorian Franc' },
        'SZ': { code: 'SZL', symbol: 'E', name: 'Swazi Lilangeni' },
        'LS': { code: 'LSL', symbol: 'L', name: 'Lesotho Loti' },
        'MG': { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary' },
        'MW': { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' },
        'MZ': { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical' },
        'NA': { code: 'NAD', symbol: 'N$', name: 'Namibian Dollar' },
        'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
        'TZ': { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
        'ZM': { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
        'ZW': { code: 'USD', symbol: '$', name: 'US Dollar' }
    };
    
    // Exchange rates cache
    let exchangeRates = {};
    let ratesLastFetched = null;
    
    // Load saved progress if exists
    loadSavedProgress();
    
    // Fetch exchange rates on load
    fetchExchangeRates();
    
    // Calculate fees when selections change
    visaTypeSelect?.addEventListener('change', calculateFees);
    processingTimeSelect?.addEventListener('change', calculateFees);
    
    // Save progress button
    saveProgressBtn?.addEventListener('click', saveProgress);
    
    // Form submission handler
    form?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        console.log('Form submitted'); // Debug log
        
        // Validate form
        if (!validateForm()) {
            console.log('Validation failed');
            return;
        }
        
        console.log('Validation passed'); // Debug log
        
        // Collect form data
        const formData = collectFormData();
        
        // Generate reference number
        const reference = generateReferenceNumber();
        
        // Calculate total fee
        const totalFee = calculateTotalFee();
        
        console.log('Reference:', reference, 'Total Fee:', totalFee); // Debug log
        
        // Create application object
        const application = {
            reference: reference,
            personalInfo: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender
            },
            contactInfo: {
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                postalCode: formData.postalCode
            },
            passportInfo: {
                number: formData.passportNumber,
                issueDate: formData.passportIssueDate,
                expiryDate: formData.passportExpiryDate,
                placeOfIssue: formData.passportPlaceOfIssue
            },
            visaInfo: {
                type: formData.visaType,
                processingTime: formData.processingTime,
                entryDate: formData.entryDate,
                exitDate: formData.exitDate
            },
            fees: {
                visaFee: parseFloat(visaFeeElement.textContent.replace('AED ', '').replace(',', '')),
                serviceFee: serviceFee,
                totalFee: totalFee
            },
            status: 'submitted',
            submissionDate: new Date().toISOString().split('T')[0],
            expectedDate: calculateExpectedDate(formData.processingTime)
        };
        
        // Save application to localStorage
        saveApplication(application);
        
        // Show success modal
        showSuccessModal(reference, totalFee);
        
        // Clear saved progress
        clearSavedProgress();
        
        // Reset form
        form.reset();
        calculateFees();
    });
    
    function calculateFees() {
        const visaType = visaTypeSelect?.value;
        const processingTime = processingTimeSelect?.value;
        
        let visaFee = 0;
        
        // Use standardized visa pricing
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
        // Extract just the AED amount, ignoring any converted currency in parentheses
        const text = totalFeeElement.textContent;
        const aedMatch = text.match(/AED\s+([\d,.]+)/);
        if (aedMatch) {
            return parseFloat(aedMatch[1].replace(',', ''));
        }
        return 0;
    }
    
    function validateForm() {
        // Basic validation
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
            // Scroll to first error
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
    
    function generateReferenceNumber() {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
        return `UAE-${year}-${random}`;
    }
    
    function calculateExpectedDate(processingTime) {
        const today = new Date();
        let daysToAdd = 3; // default
        
        if (processingTime === 'express') daysToAdd = 1;
        else if (processingTime === 'urgent') daysToAdd = 0;
        else if (processingTime === 'standard') daysToAdd = 3;
        
        today.setDate(today.getDate() + daysToAdd);
        return today.toISOString().split('T')[0];
    }
    
    function saveApplication(application) {
        // Get existing applications
        const applications = JSON.parse(localStorage.getItem('visa_applications') || '[]');
        
        // Add new application
        applications.push(application);
        
        // Save back to localStorage
        localStorage.setItem('visa_applications', JSON.stringify(applications));
    }
    
    function showSuccessModal(reference, totalFee) {
        console.log('Showing modal with reference:', reference, 'fee:', totalFee); // Debug log
        
        // Update modal content
        document.getElementById('applicationRef').textContent = reference;
        
        // Update modal to show AED
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
        } else {
            console.error('Bootstrap or modal element not found');
            alert(`Application submitted successfully!\n\nReference: ${reference}\nTotal Fee: AED ${totalFee.toFixed(2)}\n\nYou can track your application using the reference number.`);
        }
    }
    
    function saveProgress() {
        const formData = collectFormData();
        localStorage.setItem('visa_application_progress', JSON.stringify(formData));
        
        // Show notification
        showNotification('Progress saved successfully!', 'success');
    }
    
    function loadSavedProgress() {
        const savedData = localStorage.getItem('visa_application_progress');
        
        if (savedData) {
            const formData = JSON.parse(savedData);
            
            // Populate form fields
            Object.keys(formData).forEach(key => {
                const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                if (field && formData[key]) {
                    field.value = formData[key];
                }
            });
            
            // Recalculate fees
            calculateFees();
            
            // Show notification
            showNotification('Previous progress restored', 'info');
        }
    }
    
    function clearSavedProgress() {
        localStorage.removeItem('visa_application_progress');
    }
    
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Style the notification
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
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // File upload handlers
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const uploadItem = e.target.closest('.upload-item');
            const fileInfo = uploadItem.querySelector('.file-info');
            
            if (file) {
                const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
                fileInfo.innerHTML = `
                    <div class="file-selected">
                        <i class="fas fa-check-circle"></i>
                        <span>${file.name} (${fileSize} MB)</span>
                    </div>
                `;
                fileInfo.style.display = 'block';
                
                // Add uploaded class for green success styling
                uploadItem.classList.add('uploaded');
            }
        });
    });
    
    // Fetch exchange rates from API
    async function fetchExchangeRates() {
        try {
            // Check if rates are cached and still fresh (within 24 hours)
            const now = new Date().getTime();
            if (ratesLastFetched && (now - ratesLastFetched < 24 * 60 * 60 * 1000)) {
                return; // Use cached rates
            }
            
            // Fetch from exchangerate-api.com (free tier, no key required)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/AED');
            if (!response.ok) throw new Error('Failed to fetch rates');
            
            const data = await response.json();
            exchangeRates = data.rates;
            ratesLastFetched = now;
            
            console.log('Exchange rates loaded successfully');
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            // Rates will remain empty, and conversion won't display
        }
    }
    
    function updateCurrencyDisplay() {
        // Simply recalculate fees which will update the currency display
        calculateFees();
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
        
        // Get currency symbol
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
    
    // Update converter when exchange rates are loaded
    const originalFetchRates = fetchExchangeRates;
    fetchExchangeRates = async function() {
        await originalFetchRates();
        updateConverterResult();
    };
    
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
