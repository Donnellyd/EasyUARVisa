// Initialize Dubai Visa Portal SDK
const sdk = new DubaiVisaPortalSDK({
    apiBaseUrl: 'https://workspace.duane16.repl.co',
    onError: (error) => {
        console.error('SDK Error:', error);
    },
    onSuccess: (message) => {
        console.log('SDK Success:', message);
    }
});

// Status tracking functionality
document.addEventListener('DOMContentLoaded', function() {
    const statusForm = document.getElementById('statusSearchForm');
    const applicationRefInput = document.getElementById('applicationReference');
    const emailInput = document.getElementById('applicantEmail');
    const passportInput = document.getElementById('applicantPassport');
    const statusResults = document.getElementById('statusResults');
    const errorMessage = document.getElementById('errorMessage');
    
    let stopTracking = null; // Track auto-refresh
    
    // Form submission handler - NOW USES REAL API
    statusForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Stop any existing tracking
        if (stopTracking) {
            stopTracking();
            stopTracking = null;
        }
        
        const email = emailInput?.value.trim();
        const passport = passportInput?.value.trim();
        
        if (!email || !passport) {
            showError('Please enter both email and passport number');
            return;
        }
        
        // Search for application using SDK
        await searchApplicationByCredentials(email, passport);
    });
    
    // Refresh status button handler
    document.addEventListener('click', async function(e) {
        if (e.target.closest('#refreshStatus')) {
            const email = emailInput?.value.trim();
            const passport = passportInput?.value.trim();
            
            if (email && passport) {
                await searchApplicationByCredentials(email, passport);
            }
        }
    });
    
    // Download visa button handler
    document.addEventListener('click', function(e) {
        if (e.target.closest('#downloadVisa')) {
            downloadVisa();
        }
    });
    
    async function searchApplicationByCredentials(email, passport) {
        hideResults();
        showLoading();
        
        try {
            console.log('Searching for applications:', email, passport);
            
            let applications = [];
            let fromLocalStorage = false;
            
            try {
                // Try to check application status via SDK (backend)
                applications = await sdk.checkApplicationStatus(email, passport);
                console.log('Found applications from backend:', applications.length);
                
            } catch (backendError) {
                console.warn('Backend lookup failed, checking localStorage:', backendError);
                
                // Backend failed - check localStorage
                fromLocalStorage = true;
                applications = searchLocalApplications(email, passport);
                console.log('Found applications from localStorage:', applications.length);
                
                if (applications.length > 0) {
                    showNotification('Showing locally saved application. Backend connection unavailable.', 'info');
                }
            }
            
            hideLoading();
            
            if (!applications || applications.length === 0) {
                showNotFound();
                return;
            }
            
            // Display the first application (or most recent)
            displayApplicationStatus(applications[0], false, fromLocalStorage);
            
            // Start auto-refresh for status updates (every 30 seconds) - only if from backend
            if (!fromLocalStorage) {
                startAutoRefresh(email, passport);
            }
            
        } catch (error) {
            hideLoading();
            console.error('Error searching application:', error);
            showError('Error checking application status: ' + error.message);
        }
    }
    
    function startAutoRefresh(email, passport) {
        // Stop existing tracker if any
        if (stopTracking) {
            stopTracking();
        }
        
        // Start tracking with SDK (auto-refreshes every 30 seconds)
        stopTracking = sdk.trackApplicationStatus(
            email,
            passport,
            (error, applications) => {
                if (error) {
                    console.error('Auto-refresh error:', error);
                    return;
                }
                
                if (applications && applications.length > 0) {
                    // Silently update the display without showing loading
                    displayApplicationStatus(applications[0], true);
                }
            },
            30000 // 30 seconds
        );
        
        console.log('Auto-refresh enabled (every 30 seconds)');
    }
    
    function displayApplicationStatus(application, silent = false, fromLocalStorage = false) {
        hideError();
        
        if (!silent) {
            console.log('Displaying application:', application);
        }
        
        // Populate basic information
        document.getElementById('displayReference').textContent = application.applicationNumber || 'N/A';
        
        // Handle both backend (fullName) and local (firstName + lastName) formats
        const applicantName = application.fullName || 
            `${application.firstName || ''} ${application.lastName || ''}`.trim() || 'N/A';
        document.getElementById('applicantName').textContent = applicantName;
        
        // Map visa type
        document.getElementById('visaType').textContent = getVisaTypeLabel(application.visaType);
        
        document.getElementById('processingType').textContent = 
            getProcessingTypeLabel(application.processingTime);
        
        // Handle both backend (createdAt) and local (submittedAt) formats
        const submissionDate = application.createdAt || application.submittedAt;
        document.getElementById('submissionDate').textContent = 
            formatDate(submissionDate);
        
        document.getElementById('expectedDate').textContent = 
            application.expectedCompletionDate ? formatDate(application.expectedCompletionDate) : 'TBD';
        
        // Set current status badge
        const statusBadge = document.getElementById('currentStatus');
        const currentStatus = application.status || 'pending';
        
        // Use SDK status label if available and not from localStorage
        const statusLabel = !fromLocalStorage && sdk.getStatusLabel ? 
            sdk.getStatusLabel(currentStatus) : 
            getLocalStatusLabel(currentStatus);
            
        statusBadge.textContent = statusLabel;
        statusBadge.className = `status-badge status-${currentStatus}`;
        
        // Update timeline based on status
        updateTimelineFromStatus(currentStatus);
        
        // Show/hide download button
        const downloadBtn = document.getElementById('downloadVisa');
        if (application.status === 'approved') {
            downloadBtn.style.display = 'inline-flex';
        } else {
            downloadBtn.style.display = 'none';
        }
        
        // Show results
        statusResults.style.display = 'block';
        
        // Scroll to results (only if not silent update)
        if (!silent) {
            statusResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    function updateTimelineFromStatus(status) {
        // Map SDK status to timeline steps
        const statusMapping = {
            'open': 1,           // Application submitted
            'captured': 2,       // Payment received (review)
            'submitted': 2,      // Under review
            'processing': 3,     // Processing
            'approved': 4,       // Approved
            'declined': 4        // Declined
        };
        
        const currentStep = statusMapping[status] || 1;
        
        // Update timeline steps
        const steps = [
            { id: 'submitted-step', step: 1 },
            { id: 'review-step', step: 2 },
            { id: 'processing-step', step: 3 },
            { id: 'approved-step', step: 4 }
        ];
        
        steps.forEach(({ id, step }) => {
            const stepElement = document.getElementById(id);
            if (!stepElement) return;
            
            if (step < currentStep) {
                // Completed steps
                stepElement.classList.add('completed');
                stepElement.classList.remove('active');
            } else if (step === currentStep) {
                // Current step
                stepElement.classList.add('active');
                stepElement.classList.remove('completed');
            } else {
                // Future steps
                stepElement.classList.remove('completed', 'active');
            }
        });
    }
    
    function getVisaTypeLabel(type) {
        const types = {
            'single-entry-30': 'Single Entry 30 Days',
            'multiple-entry-30': 'Multiple Entry 30 Days',
            'single-entry-60': 'Single Entry 60 Days',
            'multiple-entry-60': 'Multiple Entry 60 Days',
            'tourist': 'Tourist Visa',
            'business': 'Business Visa',
            'transit': 'Transit Visa'
        };
        return types[type] || type;
    }
    
    function getProcessingTypeLabel(type) {
        const types = {
            'standard': 'Standard',
            'express': 'Express',
            'urgent': 'Urgent'
        };
        return types[type] || type;
    }
    
    function getLocalStatusLabel(status) {
        const labels = {
            'pending': 'Pending',
            'open': 'Open',
            'captured': 'Payment Received',
            'submitted': 'Under Review',
            'processing': 'Processing',
            'approved': 'Approved',
            'declined': 'Declined'
        };
        return labels[status] || status;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    function showLoading() {
        const searchBtn = statusForm.querySelector('button[type="submit"]');
        const originalHTML = searchBtn.innerHTML;
        
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        searchBtn.disabled = true;
        searchBtn.dataset.originalHTML = originalHTML;
    }
    
    function hideLoading() {
        const searchBtn = statusForm.querySelector('button[type="submit"]');
        if (searchBtn.dataset.originalHTML) {
            searchBtn.innerHTML = searchBtn.dataset.originalHTML;
        }
        searchBtn.disabled = false;
    }
    
    function hideResults() {
        statusResults.style.display = 'none';
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }
    
    function showNotFound() {
        hideResults();
        showError('No applications found with the provided email and passport number.');
    }
    
    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        
        // Also remove any inline errors
        const existingError = statusForm?.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }
    }
    
    function showError(message) {
        // Create temporary error message
        const tempError = document.createElement('div');
        tempError.className = 'alert alert-danger mt-3';
        tempError.style.cssText = `
            padding: 1rem;
            background: #fee2e2;
            border: 1px solid #ef4444;
            border-radius: 8px;
            color: #991b1b;
            margin-top: 1rem;
        `;
        tempError.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        // Remove any existing error
        const existingError = statusForm?.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error
        if (statusForm) {
            statusForm.appendChild(tempError);
            
            // Remove after 8 seconds
            setTimeout(() => {
                if (tempError.parentNode) {
                    tempError.remove();
                }
            }, 8000);
        }
    }
    
    function downloadVisa() {
        const reference = document.getElementById('displayReference').textContent;
        const applicantName = document.getElementById('applicantName').textContent;
        const visaType = document.getElementById('visaType').textContent;
        
        // Create visa document content
        const visaContent = `
═══════════════════════════════════════════
        UAE VISA APPROVAL
═══════════════════════════════════════════

Reference Number: ${reference}
Applicant Name: ${applicantName}
Visa Type: ${visaType}

Status: APPROVED ✓

Issue Date: ${new Date().toLocaleDateString()}

This document serves as your UAE visa approval.
Please present this along with your passport 
at UAE immigration.

───────────────────────────────────────────
UAE VISA - Official UAE Visa Portal
Support: support@easyuaevisa.com
═══════════════════════════════════════════
        `;
        
        // Create and download file
        const blob = new Blob([visaContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `UAE-Visa-${reference}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('Visa document downloaded successfully!', 'success');
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
        }, 4000);
    }
    
    function searchLocalApplications(email, passport) {
        const data = localStorage.getItem('visa_applications');
        if (!data) return [];
        
        try {
            const applications = JSON.parse(data);
            
            // Filter applications by email and passport
            return applications.filter(app => 
                app.email?.toLowerCase() === email.toLowerCase() &&
                app.passportNumber?.toLowerCase() === passport.toLowerCase()
            );
        } catch (error) {
            console.error('Error parsing local applications:', error);
            return [];
        }
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (stopTracking) {
            stopTracking();
        }
    });
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
    
    .status-badge {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-open {
        background: #F59E0B;
        color: white;
    }
    
    .status-captured {
        background: #3B82F6;
        color: white;
    }
    
    .status-submitted {
        background: #3B82F6;
        color: white;
    }
    
    .status-processing {
        background: #8B5CF6;
        color: white;
    }
    
    .status-approved {
        background: #10B981;
        color: white;
    }
    
    .status-declined {
        background: #EF4444;
        color: white;
    }
`;
document.head.appendChild(style);
