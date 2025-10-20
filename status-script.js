// Status tracking functionality
document.addEventListener('DOMContentLoaded', function() {
    const statusForm = document.getElementById('statusSearchForm');
    const applicationRefInput = document.getElementById('applicationReference');
    const statusResults = document.getElementById('statusResults');
    const errorMessage = document.getElementById('errorMessage');
    const recentApplications = document.getElementById('recentApplications');
    
    // Sample statuses for demonstration
    const sampleStatuses = {
        'UAE-2024-123456': {
            reference: 'UAE-2024-123456',
            status: 'approved',
            applicantName: 'John Smith',
            visaType: 'Tourist Visa - 30 Days Single Entry',
            nationality: 'United States',
            processingType: 'Express (1-2 days)',
            submissionDate: '2024-01-15',
            expectedDate: '2024-01-17',
            timeline: {
                submitted: { date: '2024-01-15 10:30 AM', completed: true },
                review: { date: '2024-01-15 2:15 PM', completed: true },
                processing: { date: '2024-01-16 9:00 AM', completed: true },
                approved: { date: '2024-01-16 4:45 PM', completed: true }
            }
        },
        'UAE-2024-789012': {
            reference: 'UAE-2024-789012',
            status: 'processing',
            applicantName: 'Sarah Johnson',
            visaType: 'Business Visa - 30 Days',
            nationality: 'United Kingdom',
            processingType: 'Standard (3-5 days)',
            submissionDate: '2024-01-14',
            expectedDate: '2024-01-19',
            timeline: {
                submitted: { date: '2024-01-14 3:20 PM', completed: true },
                review: { date: '2024-01-15 11:30 AM', completed: true },
                processing: { date: '2024-01-16 8:15 AM', completed: false, active: true },
                approved: { date: '', completed: false }
            }
        },
        'UAE-2024-345678': {
            reference: 'UAE-2024-345678',
            status: 'review',
            applicantName: 'Ahmed Hassan',
            visaType: 'Tourist Visa - 90 Days Single Entry',
            nationality: 'Canada',
            processingType: 'Urgent (Same day)',
            submissionDate: '2024-01-16',
            expectedDate: '2024-01-16',
            timeline: {
                submitted: { date: '2024-01-16 1:45 PM', completed: true },
                review: { date: '2024-01-16 2:30 PM', completed: false, active: true },
                processing: { date: '', completed: false },
                approved: { date: '', completed: false }
            }
        }
    };
    
    // Load recent applications on page load
    loadRecentApplications();
    
    // Form submission handler
    statusForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const reference = applicationRefInput.value.trim().toUpperCase();
        
        if (!reference) {
            showError('Please enter an application reference number');
            return;
        }
        
        // Validate reference format
        if (!isValidReferenceFormat(reference)) {
            showError('Invalid reference format. Reference should be in format: UAE-YYYY-XXXXXX');
            return;
        }
        
        // Search for application
        searchApplication(reference);
    });
    
    // Add click handlers for recent applications
    document.addEventListener('click', function(e) {
        if (e.target.closest('.recent-app-item')) {
            const reference = e.target.closest('.recent-app-item').dataset.reference;
            applicationRefInput.value = reference;
            searchApplication(reference);
        }
    });
    
    // Refresh status button handler
    document.addEventListener('click', function(e) {
        if (e.target.closest('#refreshStatus')) {
            const currentRef = document.getElementById('displayReference')?.textContent;
            if (currentRef) {
                searchApplication(currentRef);
            }
        }
    });
    
    // Download visa button handler
    document.addEventListener('click', function(e) {
        if (e.target.closest('#downloadVisa')) {
            downloadVisa();
        }
    });
    
    function isValidReferenceFormat(reference) {
        const pattern = /^UAE-\d{4}-\d{6}$/;
        return pattern.test(reference);
    }
    
    function searchApplication(reference) {
        // Hide previous results
        hideResults();
        
        // Show loading state
        showLoading();
        
        // Simulate API delay
        setTimeout(() => {
            hideLoading();
            
            // Check local storage first
            const localApplications = JSON.parse(localStorage.getItem('visa_applications') || '[]');
            const localApp = localApplications.find(app => app.reference === reference);
            
            if (localApp) {
                displayApplicationStatus(localApp);
                return;
            }
            
            // Check sample data
            const sampleApp = sampleStatuses[reference];
            if (sampleApp) {
                displayApplicationStatus(sampleApp);
                return;
            }
            
            // Application not found
            showNotFound();
        }, 1500);
    }
    
    function displayApplicationStatus(application) {
        hideError();
        
        // Populate basic information
        document.getElementById('displayReference').textContent = application.reference;
        document.getElementById('applicantName').textContent = 
            application.personalInfo ? 
            `${application.personalInfo.firstName} ${application.personalInfo.lastName}` :
            application.applicantName;
        
        document.getElementById('visaType').textContent = 
            application.visaInfo ? getVisaTypeLabel(application.visaInfo.type) : application.visaType;
        
        document.getElementById('nationality').textContent = 
            application.personalInfo ? 
            getNationalityLabel(application.personalInfo.nationality) :
            application.nationality;
        
        document.getElementById('processingType').textContent = 
            application.visaInfo ? getProcessingTypeLabel(application.visaInfo.processingTime) : application.processingType;
        
        document.getElementById('submissionDate').textContent = 
            formatDate(application.submissionDate || application.submissionDate);
        
        document.getElementById('expectedDate').textContent = 
            application.expectedDate || calculateExpectedDate(application.submissionDate, application.visaInfo?.processingTime);
        
        // Set current status
        const statusBadge = document.getElementById('currentStatus');
        statusBadge.textContent = getStatusLabel(application.status);
        statusBadge.className = `status-badge ${application.status}`;
        
        // Update timeline
        updateTimeline(application);
        
        // Show/hide download button
        const downloadBtn = document.getElementById('downloadVisa');
        if (application.status === 'approved') {
            downloadBtn.style.display = 'inline-flex';
        } else {
            downloadBtn.style.display = 'none';
        }
        
        // Show results
        statusResults.style.display = 'block';
        
        // Scroll to results
        statusResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function updateTimeline(application) {
        const steps = ['submitted', 'review', 'processing', 'approved'];
        const timeline = application.timeline || generateTimelineFromStatus(application);
        
        steps.forEach(step => {
            const stepElement = document.getElementById(`${step}-step`);
            const dateElement = document.getElementById(`${step}-date`);
            
            if (timeline[step]) {
                if (timeline[step].completed) {
                    stepElement.classList.add('completed');
                    stepElement.classList.remove('active');
                } else if (timeline[step].active) {
                    stepElement.classList.add('active');
                    stepElement.classList.remove('completed');
                } else {
                    stepElement.classList.remove('completed', 'active');
                }
                
                if (dateElement) {
                    dateElement.textContent = timeline[step].date || '';
                }
            }
        });
    }
    
    function generateTimelineFromStatus(application) {
        const submissionDate = new Date(application.submissionDate);
        const timeline = {
            submitted: { 
                date: formatDateTime(submissionDate), 
                completed: true 
            },
            review: { 
                date: application.status === 'submitted' ? '' : formatDateTime(addHours(submissionDate, 2)),
                completed: ['review', 'processing', 'approved'].includes(application.status),
                active: application.status === 'review'
            },
            processing: {
                date: ['processing', 'approved'].includes(application.status) ? formatDateTime(addHours(submissionDate, 24)) : '',
                completed: application.status === 'approved',
                active: application.status === 'processing'
            },
            approved: {
                date: application.status === 'approved' ? formatDateTime(addHours(submissionDate, 48)) : '',
                completed: application.status === 'approved'
            }
        };
        
        return timeline;
    }
    
    function getVisaTypeLabel(type) {
        const types = {
            'tourist-30-single': 'Tourist Visa - 30 Days Single Entry',
            'tourist-30-multiple': 'Tourist Visa - 30 Days Multiple Entry',
            'tourist-60-single': 'Tourist Visa - 60 Days Single Entry',
            'tourist-60-multiple': 'Tourist Visa - 60 Days Multiple Entry',
            'business-30': 'Business Visa - 30 Days',
            'transit-96': 'Transit Visa - 96 Hours'
        };
        return types[type] || type;
    }
    
    function getProcessingTypeLabel(type) {
        const types = {
            'standard': 'Standard (3-5 days)',
            'express': 'Express (1-2 days)',
            'urgent': 'Urgent (Same day)'
        };
        return types[type] || type;
    }
    
    function getNationalityLabel(code) {
        const countries = {
            'BW': 'Botswana',
            'KM': 'Comoros',
            'SZ': 'Eswatini (Swaziland)',
            'LS': 'Lesotho',
            'MG': 'Madagascar',
            'MW': 'Malawi',
            'MZ': 'Mozambique',
            'NA': 'Namibia',
            'ZA': 'South Africa',
            'TZ': 'Tanzania',
            'ZM': 'Zambia',
            'ZW': 'Zimbabwe'
        };
        return countries[code] || code;
    }
    
    function getStatusLabel(status) {
        const labels = {
            'submitted': 'Submitted',
            'review': 'Under Review',
            'processing': 'Processing',
            'approved': 'Approved',
            'rejected': 'Rejected'
        };
        return labels[status] || status;
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    function formatDateTime(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    function addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }
    
    function calculateExpectedDate(submissionDate, processingType) {
        const submission = new Date(submissionDate);
        let daysToAdd = 3; // default
        
        if (processingType === 'express') daysToAdd = 1;
        else if (processingType === 'urgent') daysToAdd = 0;
        else if (processingType === 'standard') daysToAdd = 3;
        
        submission.setDate(submission.getDate() + daysToAdd);
        return formatDate(submission);
    }
    
    function showLoading() {
        const searchBtn = statusForm.querySelector('button[type="submit"]');
        const originalHTML = searchBtn.innerHTML;
        
        searchBtn.innerHTML = '<div class="loading"></div> Searching...';
        searchBtn.disabled = true;
        
        // Store original HTML for restoration
        searchBtn.dataset.originalHTML = originalHTML;
    }
    
    function hideLoading() {
        const searchBtn = statusForm.querySelector('button[type="submit"]');
        searchBtn.innerHTML = searchBtn.dataset.originalHTML;
        searchBtn.disabled = false;
    }
    
    function hideResults() {
        statusResults.style.display = 'none';
        errorMessage.style.display = 'none';
    }
    
    function showNotFound() {
        hideResults();
        errorMessage.style.display = 'block';
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
    }
    
    function showError(message) {
        // Create temporary error message
        const tempError = document.createElement('div');
        tempError.className = 'alert alert-danger mt-2';
        tempError.textContent = message;
        
        // Remove any existing error
        const existingError = statusForm.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error
        statusForm.appendChild(tempError);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (tempError.parentNode) {
                tempError.remove();
            }
        }, 5000);
    }
    
    function loadRecentApplications() {
        const applications = JSON.parse(localStorage.getItem('visa_applications') || '[]');
        
        if (applications.length === 0) return;
        
        const recentAppsList = recentApplications.querySelector('.recent-apps-list');
        recentAppsList.innerHTML = '';
        
        // Show last 3 applications
        const recentApps = applications.slice(-3).reverse();
        
        recentApps.forEach(app => {
            const appElement = document.createElement('div');
            appElement.className = 'recent-app-item';
            appElement.dataset.reference = app.reference;
            
            appElement.innerHTML = `
                <div class="recent-app-info">
                    <h4>${app.reference}</h4>
                    <p>${app.personalInfo.firstName} ${app.personalInfo.lastName} • ${getVisaTypeLabel(app.visaInfo.type)}</p>
                </div>
                <div class="recent-app-status">
                    <span class="status-badge ${app.status}">${getStatusLabel(app.status)}</span>
                </div>
            `;
            
            recentAppsList.appendChild(appElement);
        });
        
        recentApplications.style.display = 'block';
    }
    
    function downloadVisa() {
        // Simulate visa download
        const reference = document.getElementById('displayReference').textContent;
        
        // Create a simple visa document (in real implementation, this would be a PDF)
        const visaContent = `
            UAE VISA APPROVAL
            
            Reference: ${reference}
            Applicant: ${document.getElementById('applicantName').textContent}
            Visa Type: ${document.getElementById('visaType').textContent}
            Nationality: ${document.getElementById('nationality').textContent}
            
            Status: APPROVED
            
            This document serves as your UAE visa approval.
            Please present this along with your passport at immigration.
            
            Valid from: ${new Date().toLocaleDateString()}
            
            EasyUAEVisa - Official UAE Visa Portal
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
        
        // Show notification
        showNotification('Visa document downloaded successfully!', 'success');
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
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--info-color)'};
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
        
        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
});
