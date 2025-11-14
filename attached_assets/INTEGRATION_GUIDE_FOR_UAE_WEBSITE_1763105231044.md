# UAE VISA WEBSITE → Dubai Visa AI Portal Integration Guide

## Overview

This guide explains how to integrate your UAE VISA WEBSITE with the Dubai Visa AI backend portal so that visa applications submitted on your website automatically sync to the portal system.

---

## 🔑 Authentication

**API Base URL:** `https://dubai-visa-ai-duane16.replit.app`

**API Key:** `365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059`

> **⚠️ SECURITY NOTE:** This API key is provided for secure integration between the two Replit applications. Store it as an environment variable (`DUBAI_VISA_API_KEY`) in your Replit Secrets. Never commit it to public repositories or expose it in client-side code.

**Authentication Method:** Include the API key in the `X-API-Key` header with every request.

---

## 📡 API Endpoint

### Submit Visa Application

**Endpoint:** `POST /api/website/applications`

**Full URL:** `https://dubai-visa-ai-duane16.replit.app/api/website/applications`

**Headers Required:**
```javascript
{
  'Content-Type': 'application/json',
  'X-API-Key': '365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059'
}
```

---

## 📋 Required vs Optional Fields

### REQUIRED Fields (Validated by Portal)

These are the **ONLY** fields that are strictly required by the portal:

```javascript
{
  "firstName": "string",           // REQUIRED - Applicant's first name
  "lastName": "string",            // REQUIRED - Applicant's last name
  "email": "string",               // REQUIRED - Valid email address
  "passportNumber": "string"       // REQUIRED - Passport number
}
```

### Recommended Fields (Optional but Important)

While not strictly required by the API, these fields are recommended for a complete visa application:

```javascript
{
  "dateOfBirth": "string",         // Format: YYYY-MM-DD
  "nationality": "string",         // Country of nationality
  "visaType": "string",            // e.g., "tourist", "business", "transit"
  "processingTime": "string",      // e.g., "standard", "express", "super_express"
  "passportIssueDate": "string",   // Format: YYYY-MM-DD
  "passportExpiryDate": "string",  // Format: YYYY-MM-DD
  "phone": "string",               // Phone number
  "passportPlaceOfIssue": "string", // Where passport was issued
  "gender": "string",              // "male", "female", or omit
  "entryDate": "string",           // Format: YYYY-MM-DD
  "exitDate": "string",            // Format: YYYY-MM-DD
  "applicationFee": number,        // Numeric value (e.g., 350)
  "serviceFee": number,            // Numeric value (e.g., 50)
  "groupReference": "string"       // For group applications
}
```

---

## 💻 Implementation Examples

### Option 1: Using Fetch API

```javascript
async function submitVisaApplication(applicationData) {
  try {
    const response = await fetch('https://dubai-visa-ai-duane16.replit.app/api/website/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059'
      },
      body: JSON.stringify({
        firstName: applicationData.firstName,
        lastName: applicationData.lastName,
        email: applicationData.email,
        passportNumber: applicationData.passportNumber,
        dateOfBirth: applicationData.dateOfBirth,
        nationality: applicationData.nationality,
        visaType: applicationData.visaType,
        processingTime: applicationData.processingTime,
        passportIssueDate: applicationData.passportIssueDate,
        passportExpiryDate: applicationData.passportExpiryDate,
        phone: applicationData.phone,
        passportPlaceOfIssue: applicationData.passportPlaceOfIssue,
        applicationFee: applicationData.applicationFee || 0,
        serviceFee: applicationData.serviceFee || 0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Submission failed');
    }

    const result = await response.json();
    console.log('Application submitted successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Error submitting application:', error);
    throw error;
  }
}
```

### Option 2: Using Axios

```javascript
import axios from 'axios';

async function submitVisaApplication(applicationData) {
  try {
    const response = await axios.post(
      'https://dubai-visa-ai-duane16.replit.app/api/website/applications',
      {
        firstName: applicationData.firstName,
        lastName: applicationData.lastName,
        email: applicationData.email,
        passportNumber: applicationData.passportNumber,
        dateOfBirth: applicationData.dateOfBirth,
        nationality: applicationData.nationality,
        visaType: applicationData.visaType,
        processingTime: applicationData.processingTime,
        passportIssueDate: applicationData.passportIssueDate,
        passportExpiryDate: applicationData.passportExpiryDate,
        phone: applicationData.phone,
        passportPlaceOfIssue: applicationData.passportPlaceOfIssue,
        applicationFee: applicationData.applicationFee || 0,
        serviceFee: applicationData.serviceFee || 0
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059'
        }
      }
    );

    console.log('Application submitted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting application:', error.response?.data || error.message);
    throw error;
  }
}
```

---

## ✅ Success Response

When the application is successfully submitted, you'll receive:

```json
{
  "success": true,
  "application": {
    "id": "uuid-string",
    "applicationNumber": "WEB1731234567ABC",
    "status": "pending",
    "totalAmount": 400
  }
}
```

**Important:** Save the `applicationNumber` - this is the unique reference for tracking the application.

---

## ❌ Error Responses

### 401 Unauthorized (Invalid or Missing API Key)

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "message": "Please provide valid authentication credentials or API key"
}
```

**Fix:** Ensure the `X-API-Key` header is included with the correct API key.

### 400 Bad Request (Missing Required Fields)

```json
{
  "error": "Missing required application data"
}
```

**Fix:** Ensure all required fields (firstName, lastName, email, passportNumber) are included in the request.

---

## 🔧 Integration Steps

### Step 1: Store the API Key Securely

**For Backend Integration (Recommended):**
```javascript
// In your .env file or Replit Secrets
DUBAI_VISA_API_KEY=365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059
DUBAI_VISA_API_URL=https://dubai-visa-ai-duane16.replit.app

// In your code
const apiKey = process.env.DUBAI_VISA_API_KEY;
const apiUrl = process.env.DUBAI_VISA_API_URL;
```

**⚠️ NEVER expose the API key in client-side JavaScript!**

### Step 2: Update Your Form Submission Handler

Find where your visa application form is submitted and add the API call:

```javascript
// Example form submission
async function handleFormSubmit(formData) {
  try {
    // 1. Validate form data locally
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.passportNumber) {
      throw new Error('Missing required fields');
    }

    // 2. Submit to Dubai Visa AI portal
    const result = await submitVisaApplication(formData);

    // 3. Show success message to user
    alert(`Application submitted successfully! Reference: ${result.application.applicationNumber}`);

    // 4. Optionally redirect or clear form
    // window.location.href = '/success';
    
  } catch (error) {
    // Handle errors
    console.error('Submission failed:', error);
    alert('Failed to submit application. Please try again.');
  }
}
```

### Step 3: Test the Integration

1. Submit a test application from your UAE VISA website
2. Check browser console for any errors
3. Verify the application appears in the Dubai Visa AI portal's Agent Dashboard
4. Look for a 🌐 Website badge next to the application

---

## 🧪 Testing

### Test the Endpoint Directly

Use this curl command to test the endpoint:

```bash
curl -X POST https://dubai-visa-ai-duane16.replit.app/api/website/applications \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "passportNumber": "P1234567",
    "dateOfBirth": "1990-01-01",
    "nationality": "United States",
    "visaType": "tourist",
    "processingTime": "standard",
    "passportIssueDate": "2020-01-01",
    "passportExpiryDate": "2030-01-01",
    "phone": "+1234567890",
    "passportPlaceOfIssue": "New York",
    "applicationFee": 350,
    "serviceFee": 50
  }'
```

Expected response:
```json
{
  "success": true,
  "application": {
    "id": "...",
    "applicationNumber": "WEB...",
    "status": "pending",
    "totalAmount": 400
  }
}
```

---

## 🎯 Quick Implementation Checklist

- [ ] Store API key in environment variables (NOT in client-side code)
- [ ] Update API base URL to `https://dubai-visa-ai-duane16.replit.app`
- [ ] Include `X-API-Key` header in all requests
- [ ] Ensure all required fields are sent in the request body
- [ ] Handle success response (show application number to user)
- [ ] Handle error responses (show user-friendly error messages)
- [ ] Test with a real submission
- [ ] Verify application appears in Dubai Visa AI portal

---

## 🆘 Troubleshooting

### Applications not appearing in portal?

1. **Check browser console** - Look for network errors or failed requests
2. **Verify API key** - Ensure the `X-API-Key` header matches exactly
3. **Check required fields** - Ensure firstName, lastName, email, passportNumber are included
4. **CORS issues?** - The portal allows requests from `.replit.dev` domains

### Getting 401 errors?

- Double-check the API key is exactly: `365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059`
- Ensure the header name is `X-API-Key` (case-sensitive)
- Make sure the API key is included in the headers object

### Getting 400 errors?

- Verify all required fields are present in the request body
- Check that field names match exactly (case-sensitive)
- Ensure dates are in YYYY-MM-DD format

---

## 📞 Support

If you encounter issues after following this guide, check:

1. Browser console logs (F12 → Console tab)
2. Network tab (F12 → Network tab) to see the exact request/response
3. Ensure the Dubai Visa AI portal is running at the provided URL

---

## 🔐 Security Notes

- **Never** expose the API key in client-side JavaScript
- Store the API key in environment variables or backend secrets
- Make API calls from your backend/server, not directly from the browser
- The API key should be treated like a password and kept confidential

---

## 📄 QUICK COPY-PASTE PROMPT FOR UAE WEBSITE

If you want to share this with another AI agent working on the UAE website, use this prompt:

```
TASK: Connect UAE VISA WEBSITE to Dubai Visa AI Portal

Update the visa application form to submit applications to the Dubai Visa AI backend portal.

API Configuration:
- Portal URL: https://dubai-visa-ai-duane16.replit.app
- Endpoint: POST /api/website/applications
- API Key: 365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059

Add this function to submit applications:

async function submitToPortal(applicationData) {
  const response = await fetch('https://dubai-visa-ai-duane16.replit.app/api/website/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': '365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059'
    },
    body: JSON.stringify({
      firstName: applicationData.firstName,
      lastName: applicationData.lastName,
      email: applicationData.email,
      passportNumber: applicationData.passportNumber,
      dateOfBirth: applicationData.dateOfBirth,
      nationality: applicationData.nationality,
      visaType: applicationData.visaType,
      processingTime: applicationData.processingTime,
      passportIssueDate: applicationData.passportIssueDate,
      passportExpiryDate: applicationData.passportExpiryDate,
      phone: applicationData.phone || '',
      passportPlaceOfIssue: applicationData.passportPlaceOfIssue || '',
      applicationFee: applicationData.applicationFee || 0,
      serviceFee: applicationData.serviceFee || 0
    })
  });

  if (!response.ok) throw new Error('Portal submission failed');
  
  const result = await response.json();
  console.log('✅ Synced to portal:', result.application.applicationNumber);
  return result;
}

Call this function when a user submits a visa application. The application will automatically appear in the Dubai Visa AI portal with a 🌐 Website badge.

REQUIRED fields (strictly validated): firstName, lastName, email, passportNumber

RECOMMENDED fields (optional but important): dateOfBirth, nationality, visaType, processingTime, passportIssueDate, passportExpiryDate, phone, passportPlaceOfIssue, gender, entryDate, exitDate, applicationFee, serviceFee

Store the API key securely in environment variables, not in client-side code.
```

---

**Last Updated:** November 11, 2025  
**Portal URL:** https://dubai-visa-ai-duane16.replit.app  
**Status:** ✅ Active and Ready
