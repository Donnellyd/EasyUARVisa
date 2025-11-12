# API Documentation - PayFast Payment Gateway

Complete API reference for integrating with the PayFast payment gateway.

## Base URL

```
https://your-gateway.replit.app
```

Replace with your actual Replit URL or deployment URL.

## Authentication

No authentication required for API calls. Security is handled via PayFast's signature verification system.

---

## Endpoints

### 1. Health Check

Check if the gateway is running and get configuration info.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "service": "PayFast Payment Gateway",
  "version": "1.0.0",
  "payfast_mode": "sandbox",
  "gateway": "payfast"
}
```

---

### 2. Start Payment

Initiate a new PayFast payment transaction.

**Endpoint:** `POST /api/payments/start`

**Request Body:**
```json
{
  "application_id": "APP-123456",
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "amount": 786.00,
  "country": "South Africa",
  "description": "UAE Visa Application Fee"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `application_id` | string | Yes | Your application/order reference |
| `applicant_name` | string | Yes | Customer's full name |
| `applicant_email` | string | Yes | Customer's email address |
| `amount` | number | Yes | Payment amount in ZAR |
| `country` | string | No | Customer's country |
| `description` | string | No | Payment description (default: "Payment") |

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.payfast.co.za/eng/process",
  "formData": {
    "merchant_id": "10000100",
    "merchant_key": "46f0cd694581a",
    "name_first": "John",
    "name_last": "Doe",
    "email_address": "john@example.com",
    "m_payment_id": "PAY-1699876543210",
    "amount": "786.00",
    "item_name": "UAE Visa Application Fee",
    "item_description": "UAE Visa Application Fee - APP-123456",
    "return_url": "https://your-app.com/payment-success?ref=PAY-1699876543210",
    "cancel_url": "https://your-app.com/payment-cancelled?ref=PAY-1699876543210",
    "notify_url": "https://your-gateway.com/api/payments/verify",
    "custom_str1": "APP-123456",
    "custom_str2": "South Africa",
    "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
  },
  "reference": "PAY-1699876543210",
  "gateway": "payfast",
  "sandbox": true
}
```

**Usage Example (JavaScript):**

```javascript
// Call the payment gateway
const response = await fetch('https://your-gateway.replit.app/api/payments/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    application_id: 'APP-123456',
    applicant_name: 'John Doe',
    applicant_email: 'john@example.com',
    amount: 786.00,
    country: 'South Africa',
    description: 'UAE Visa Application Fee'
  })
});

const data = await response.json();

// Create a form and submit it to PayFast
const form = document.createElement('form');
form.method = 'POST';
form.action = data.paymentUrl;

// Add all form fields
for (const [key, value] of Object.entries(data.formData)) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = key;
  input.value = value;
  form.appendChild(input);
}

document.body.appendChild(form);
form.submit(); // Redirect to PayFast
```

**Error Response:**
```json
{
  "error": "Missing required fields",
  "required": ["application_id", "applicant_name", "applicant_email", "amount"]
}
```

---

### 3. Verify Payment (Webhook)

PayFast ITN (Instant Transaction Notification) webhook endpoint.

**⚠️ Important:** This endpoint is called automatically by PayFast. You don't need to call it manually.

**Endpoint:** `POST /api/payments/verify`

**Request Body (from PayFast):**
```json
{
  "m_payment_id": "PAY-1699876543210",
  "pf_payment_id": "12345678",
  "payment_status": "COMPLETE",
  "item_name": "UAE Visa Application Fee",
  "amount_gross": "786.00",
  "signature": "..."
}
```

**Response:**
```
OK
```

**Payment Status Values:**
- `COMPLETE` - Payment successful
- `FAILED` - Payment failed
- `CANCELLED` - Payment cancelled by user

**Database Update:**

When this webhook is called, the payment status in the database is automatically updated:

| PayFast Status | Database Status |
|----------------|-----------------|
| `COMPLETE` | `paid` |
| `FAILED` | `failed` |
| `CANCELLED` | `cancelled` |

---

### 4. Check Payment Status

Check the status of a payment by reference.

**Endpoint:** `GET /api/payments/status/:reference`

**Parameters:**

| Field | Type | Location | Description |
|-------|------|----------|-------------|
| `reference` | string | URL path | Payment reference (e.g., PAY-1699876543210) |

**Example Request:**
```
GET /api/payments/status/PAY-1699876543210
```

**Response:**
```json
{
  "id": 1,
  "reference": "PAY-1699876543210",
  "application_id": "APP-123456",
  "amount": "786.00",
  "currency": "ZAR",
  "email": "john@example.com",
  "name": "John Doe",
  "country": "South Africa",
  "status": "paid",
  "payment_id": "12345678",
  "created_at": "2024-11-11T10:00:00.000Z",
  "updated_at": "2024-11-11T10:05:00.000Z"
}
```

**Status Values:**
- `pending` - Payment initiated but not completed
- `paid` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled

**Error Response:**
```json
{
  "error": "Payment not found"
}
```

---

## Payment Flow

Here's the complete payment flow:

```
1. Your App → Gateway: POST /api/payments/start
   ↓
2. Gateway → Your App: Returns payment URL and form data
   ↓
3. Your App → PayFast: Submit POST form with payment data
   ↓
4. PayFast → Customer: Payment page
   ↓
5. Customer → PayFast: Completes payment
   ↓
6. PayFast → Gateway: POST /api/payments/verify (webhook)
   ↓
7. Gateway → Database: Updates payment status
   ↓
8. PayFast → Customer: Redirect to return_url
   ↓
9. Your App → Gateway: GET /api/payments/status/:reference
   ↓
10. Gateway → Your App: Returns payment status
```

---

## Integration Example

**Complete integration from your application:**

```javascript
// Step 1: Initiate payment
async function startPayment(applicationData) {
  const response = await fetch('https://your-gateway.replit.app/api/payments/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      application_id: applicationData.id,
      applicant_name: applicationData.fullName,
      applicant_email: applicationData.email,
      amount: applicationData.totalAmount,
      country: applicationData.country,
      description: 'Visa Application Fee'
    })
  });
  
  const paymentData = await response.json();
  
  // Step 2: Redirect to PayFast
  redirectToPayFast(paymentData);
}

// Step 2: Redirect to PayFast
function redirectToPayFast(paymentData) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentData.paymentUrl;
  
  for (const [key, value] of Object.entries(paymentData.formData)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  
  document.body.appendChild(form);
  form.submit();
}

// Step 3: Check payment status (on return URL page)
async function checkPaymentStatus(reference) {
  const response = await fetch(
    `https://your-gateway.replit.app/api/payments/status/${reference}`
  );
  
  const payment = await response.json();
  
  if (payment.status === 'paid') {
    console.log('Payment successful!');
    // Update your application
  } else if (payment.status === 'failed') {
    console.log('Payment failed');
  }
  
  return payment;
}
```

---

## Error Codes

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 200 | - | Success |
| 400 | Bad Request | Missing or invalid parameters |
| 404 | Not Found | Payment reference not found |
| 500 | Internal Server Error | Server error |

---

## Testing

### Test with PayFast Sandbox

1. Make sure `PAYFAST_SANDBOX=true` in your environment
2. Use PayFast's test credentials (already configured)
3. Test payments using sandbox: https://sandbox.payfast.co.za

### Test Card Details (Sandbox):

PayFast sandbox accepts any valid card format:
- Card Number: `4000 0000 0000 0002`
- Expiry: Any future date
- CVV: Any 3 digits

---

## Best Practices

1. **Always verify payment status** on your return URL page
2. **Don't rely solely on the return URL** - use the webhook (ITN)
3. **Store the payment reference** to check status later
4. **Use HTTPS** in production for security
5. **Set a passphrase** for enhanced security
6. **Test in sandbox** before going live

---

## Support

- PayFast API Docs: https://developers.payfast.co.za
- PayFast Support: https://www.payfast.co.za/support
- Sandbox Dashboard: https://sandbox.payfast.co.za

---

**Ready to integrate?** Check out `examples/integration-example.js` for a complete working example!
