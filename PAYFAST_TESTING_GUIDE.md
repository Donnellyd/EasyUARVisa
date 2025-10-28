# PayFast Testing Guide - UAE Visa Portal

## ✅ Current Setup

Your PayFast sandbox credentials are now securely configured and active:

- **Merchant ID**: 10043149 (your account)
- **Merchant Key**: en0yz0p4dh10f (encrypted)
- **Passphrase**: Visatest1245 (encrypted)
- **Mode**: **SANDBOX** (testing mode enabled)

All test payments will appear in **YOUR PayFast sandbox dashboard** at: https://sandbox.payfast.co.za

## 🧪 How to Test

### Step 1: Submit a Visa Application
1. Go to your website homepage
2. Click **"Start My Journey"** or **"Apply Now"**
3. Fill out the visa application form
4. Submit the application

### Step 2: Payment Process
1. After submission, you'll be redirected to the **payment page**
2. The page shows:
   - Your application reference number
   - Amount due: **AED 1,980** (Multiple Entry 60 Days visa)
   - Pre-filled applicant details
3. Select your country from the dropdown
4. Click **"Proceed to Payment"**

### Step 3: PayFast Sandbox Checkout
1. You'll be redirected to **PayFast Sandbox** payment page
2. **Test card details** you can use:
   - Card Number: `4000 0000 0000 0002`
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits (e.g., 123)
   - Name: Any name

3. Complete the test payment
4. You'll be redirected back to the success page

### Step 4: Verify Payment
1. **In your application**: Check the payment success page
2. **In your PayFast dashboard**: Login to https://sandbox.payfast.co.za
   - You should see the test transaction listed
   - Amount will show in ZAR (converted from AED)

## 💰 Pricing
- **Single Entry 30 Days**: AED 620
- **Multiple Entry 60 Days**: AED 1,980 (default in payment flow)

## 🔄 Payment Flow Architecture

```
User Application → Flask Frontend (port 5000)
                          ↓
              Payment Page (payment.html)
                          ↓
          Node.js Backend (port 3000) + PayFast SDK
                          ↓
              PayFast Sandbox Gateway
                          ↓
                PostgreSQL Database
                          ↓
              Success/Failure Pages
```

## 🔐 Security Features

✅ All credentials stored as encrypted environment variables  
✅ Sandbox mode prevents accidental live charges  
✅ MD5 signature verification for security  
✅ Database logging of all payment attempts  
✅ Secure payment gateway redirect (no card data touches your server)

## 🚀 Going Live (When Ready)

When you're ready to accept real payments:

1. **Switch to Live Mode**:
   - In Replit Secrets, change `PAYFAST_SANDBOX` from `true` to `false`
   - Update your PayFast credentials to **live** merchant credentials (not sandbox)

2. **Get Live Credentials**:
   - Login to your PayFast account
   - Go to Settings → Integration
   - Copy your live Merchant ID and Merchant Key
   - Set a strong passphrase

3. **Update Secrets**:
   - PAYFAST_MERCHANT_ID: [Your live merchant ID]
   - PAYFAST_MERCHANT_KEY: [Your live merchant key]
   - PAYFAST_PASSPHRASE: [Your live passphrase]
   - PAYFAST_SANDBOX: `false`

4. **Restart Servers**:
   - Both workflows will auto-restart when you change secrets
   - Verify the Payment Backend log shows: `🧪 Sandbox mode: false`

## 📊 Monitoring

### Database Queries
All payments are logged in the PostgreSQL database. To view them:

```sql
SELECT * FROM payments ORDER BY created_at DESC;
```

### Check Payment Status
```sql
SELECT reference, status, amount, email, created_at 
FROM payments 
WHERE application_id = 'UAE-XXXXXXXX-XXXX';
```

## 🎨 Design Notes

Payment pages follow UAE color theme:
- ✅ Black buttons and navigation
- ✅ Red pricing and accents (#c8102e)
- ✅ Dark grey headings (#333333)
- ✅ Green, white, grey supporting colors
- ❌ NO BLUE colors (pure UAE theme)

## 🐛 Troubleshooting

### Backend Not Responding
- Check Payment Backend workflow is running (port 3000)
- Check logs: Look for "💳 Ready to process payments"

### Payment Gateway Not Loading
- Verify PayFast credentials are correct
- Check sandbox mode is enabled for testing
- Ensure internet connection is stable

### Payment Not Saving to Database
- Check DATABASE_URL environment variable is set
- Verify PostgreSQL is running
- Check Payment Backend logs for errors

## 📞 Support

- **PayFast Documentation**: https://developers.payfast.co.za
- **PayFast Sandbox**: https://sandbox.payfast.co.za
- **PayFast Support**: support@payfast.co.za

---

**Ready to test!** Your payment system is fully configured with your PayFast sandbox account. All test transactions will appear in your dashboard.
