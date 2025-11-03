# UAE VISA ↔ DubaiVisa AI Integration Guide

## Overview

This document explains how the **UAE VISA website** (frontend) integrates with the **DubaiVisa AI portal** (backend) to create a complete visa application system.

## Architecture

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   UAE VISA Website      │         │   DubaiVisa AI Portal    │
│   (This Replit)         │◄───────►│   (Backend Processing)   │
│                         │   SDK   │                          │
│  - Application Forms    │         │  - Application Storage   │
│  - Status Tracking      │         │  - Document Management   │
│  - Payment Gateway      │         │  - Admin Portal          │
│  - Document Upload      │         │  - Status Updates        │
└─────────────────────────┘         └──────────────────────────┘
```

## Integration Components

### 1. SDK Integration

**File:** `static/visa-portal-sdk.js`

The JavaScript SDK (`DubaiVisaPortalSDK`) handles all communication with the backend.

**Initialized in:**
- `application-script.js` - Application submission
- `status-script.js` - Status tracking
- `payment-success.html` - Payment notifications

**Configuration:**
```javascript
const sdk = new DubaiVisaPortalSDK({
    apiBaseUrl: 'https://workspace.duane16.repl.co',
    onError: (error) => console.error('SDK Error:', error),
    onSuccess: (message) => console.log('SDK Success:', message)
});
```

### 2. Application Submission Flow

**User Journey:**
1. User fills out visa application form (`application.html`)
2. Form data is validated client-side
3. Application is submitted to DubaiVisa AI backend via SDK
4. Backend creates application record and returns application number
5. Documents are uploaded (if any) to backend storage
6. User is shown success message with application number
7. User is redirected to payment page

**Key Code:** `application-script.js` lines 74-186

```javascript
// Submit application via SDK
const result = await sdk.submitApplication(applicationData);
const applicationId = result.application.id;
const applicationNumber = result.application.applicationNumber;

// Upload documents if provided
await uploadDocuments(applicationId);
```

**Fallback:** If backend is unavailable, applications are saved to localStorage

### 3. Status Tracking Flow

**User Journey:**
1. User enters email + passport number (`status.html`)
2. SDK queries backend for matching applications
3. Backend returns real-time application status
4. Status is displayed with progress tracking
5. Auto-refresh updates status every 30 seconds

**Key Code:** `status-script.js` lines 64-139

```javascript
// Check status via SDK (public endpoint - no auth required)
const applications = await sdk.checkApplicationStatus(email, passport);

// Start auto-refresh
stopTracking = sdk.trackApplicationStatus(email, passport, callback, 30000);
```

**Fallback:** If backend is unavailable, status is checked from localStorage

### 4. Payment Integration Flow

**User Journey:**
1. User submits application
2. User proceeds to payment page with pre-filled details
3. PayFast payment is initiated (local backend on port 3000)
4. User completes payment on PayFast gateway
5. PayFast redirects to success page with payment reference
6. Success page notifies DubaiVisa AI backend of payment
7. Backend updates application status to "captured" (payment received)

**Key Code:** 
- Payment initiation: `backend/server.js` lines 179-260
- Payment notification: `payment-success.html` lines 108-135

```javascript
// Notify backend of successful payment
await fetch(`${sdk.apiBaseUrl}/api/website/applications/${applicationId}/payment`, {
    method: 'POST',
    body: JSON.stringify({
        paymentReference: reference,
        status: 'paid',
        paidAt: new Date().toISOString()
    })
});
```

### 5. Document Upload Flow

**User Journey:**
1. User selects files during application submission
2. After application is created, documents are uploaded
3. SDK requests upload URL from backend
4. Files are uploaded to Replit Object Storage
5. Document references are saved to application record

**Key Code:** `application-script.js` lines 189-225

```javascript
// Upload documents using SDK
await sdk.uploadDocuments(applicationId, documentsToUpload, (progress) => {
    console.log(`Upload progress: ${progress.percentage}%`);
});
```

## API Endpoints Used

### From DubaiVisa AI Backend

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/website/applications` | POST | Submit new application | No |
| `/api/website/status/{email}/{passport}` | GET | Check application status | No |
| `/api/website/objects/upload` | POST | Get document upload URL | No |
| `/api/website/applications/{id}/documents` | POST | Save document reference | No |
| `/api/website/applications/{id}/payment` | POST | Update payment status | No |

## Data Flow

### Application Data Format

**Sent to Backend:**
```javascript
{
    firstName: string,
    lastName: string,
    dateOfBirth: string (YYYY-MM-DD),
    gender: string (Male/Female),
    nationality: string,
    email: string,
    phone: string,
    passportNumber: string,
    passportIssueDate: string (YYYY-MM-DD),
    passportExpiryDate: string (YYYY-MM-DD),
    passportPlaceOfIssue: string,
    visaType: string (single-entry-30, multiple-entry-30, etc),
    processingTime: string (standard/express/urgent),
    entryDate: string (YYYY-MM-DD),
    exitDate: string (YYYY-MM-DD),
    applicationFee: number (in cents),
    serviceFee: number (in cents)
}
```

**Received from Backend:**
```javascript
{
    application: {
        id: string,
        applicationNumber: string,
        status: string,
        createdAt: timestamp,
        expectedCompletionDate: timestamp,
        ...other fields
    }
}
```

### Status Values

| Status | Meaning | Display |
|--------|---------|---------|
| `open` | Awaiting payment | "Awaiting Payment" |
| `captured` | Payment received | "Payment Received" |
| `submitted` | Under verification | "Under Verification" |
| `processing` | Processing visa | "Processing Visa" |
| `approved` | Visa approved | "Approved" |
| `declined` | Visa declined | "Declined" |

## Fallback System

Both application submission and status tracking have localStorage fallbacks:

**When Backend is Unavailable:**
1. Applications are saved to `localStorage` with status "pending"
2. Generated local reference number: `UAE-LOCAL-{timestamp}`
3. User can still track locally saved applications
4. Applications will sync when backend becomes available

**localStorage Keys:**
- `uaeVisaApplications` - Array of locally saved applications
- `pendingPayment_{ref}` - Payment intent for incomplete payments

## Testing the Integration

### Test Application Submission

1. Go to `application.html`
2. Fill out the form with test data
3. Submit the form
4. Check browser console for SDK logs
5. Verify application appears in DubaiVisa AI backend portal

### Test Status Tracking

1. Go to `status.html`
2. Enter email + passport used in test application
3. Verify real-time status is displayed
4. Check auto-refresh is working (console logs every 30s)

### Test Payment Flow

1. Submit an application
2. Proceed to payment page
3. Use PayFast sandbox credentials to complete payment
4. Verify redirect to success page
5. Check DubaiVisa AI backend shows status updated to "captured"

## Environment Configuration

### This Website (UAE VISA)

**Required Secrets:**
- `PAYFAST_MERCHANT_ID` - PayFast sandbox merchant ID
- `PAYFAST_MERCHANT_KEY` - PayFast sandbox merchant key
- `PAYFAST_PASSPHRASE` - PayFast sandbox passphrase
- `PAYFAST_SANDBOX` - Set to "true"

**Backend URL:** Hardcoded in SDK initialization as `https://workspace.duane16.repl.co`

### DubaiVisa AI Backend

No configuration changes needed - already has all API endpoints implemented.

## Troubleshooting

### Applications not appearing in backend
- Check browser console for SDK errors
- Verify backend URL is correct in SDK initialization
- Check network tab for failed API requests
- Ensure backend is running and accessible

### Status not updating
- Verify email and passport match exactly
- Check auto-refresh is enabled (console logs)
- Ensure backend is returning data for the query

### Payment not reflecting in backend
- Check payment success URL includes `application_id` parameter
- Verify payment notification function is executing
- Check backend logs for payment update requests

## Migration Notes

### Moving to Production

**PayFast:**
1. Register for live PayFast merchant account
2. Get production credentials (different from sandbox)
3. Update environment variables:
   - `PAYFAST_MERCHANT_ID` - Production merchant ID
   - `PAYFAST_MERCHANT_KEY` - Production merchant key  
   - `PAYFAST_PASSPHRASE` - Production passphrase
   - `PAYFAST_SANDBOX` - Set to "false"
4. Update PayFast endpoint in `backend/server.js`

**Backend URL:**
If DubaiVisa AI moves to production domain, update SDK initialization in:
- `application-script.js` line 3
- `status-script.js` line 3
- `payment-success.html` line 84

## Support

For integration issues:
1. Check browser console for detailed error messages
2. Verify all API endpoints are responding
3. Check network tab for request/response details
4. Review backend logs in DubaiVisa AI portal

---

**Last Updated:** November 3, 2025
**Integration Version:** 1.0.0
