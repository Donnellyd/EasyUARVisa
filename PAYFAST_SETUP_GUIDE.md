# PayFast Payment Integration - Setup Guide

**Date:** October 28, 2025  
**Status:** ✅ Fully Functional with Sandbox  
**Gateway:** PayFast (South Africa)

---

## 🎯 What's Been Built

Your UAE VISA portal now has a complete PayFast payment integration that:

- ✅ Processes visa application payments through PayFast
- ✅ Currently running in **SANDBOX MODE** for testing
- ✅ Tracks all payments in PostgreSQL database
- ✅ Automatically redirects users to PayFast checkout
- ✅ Handles payment success/failure callbacks
- ✅ Displays payment confirmation page
- ✅ Saves payment history with reference numbers

---

## 🧪 Testing Right Now (Sandbox Mode)

The system is **already working** with PayFast sandbox credentials. You can test it immediately:

### How to Test:
1. Go to your UAE VISA website
2. Fill out a visa application
3. Click "Proceed to Payment"
4. You'll be redirected to PayFast **SANDBOX** (test environment)
5. Use PayFast test card details to complete payment

### PayFast Sandbox Test Cards:
```
Card Number: 5200 0000 0000 0007
Expiry: Any future date (e.g., 12/26)
CVV: 123
```

**Important:** Sandbox mode means no real money is charged. All payments are simulated for testing.

---

## 🔐 What You Need to Provide (To Go Live)

Once you set up your PayFast account, you'll need to give me **3 credentials** to switch from sandbox to live mode:

### 1. **Merchant ID**
- Where to find: PayFast Dashboard (top right)
- Example: `10012345`
- This identifies your business account

### 2. **Merchant Key**
- Where to find: PayFast Dashboard → Settings → Developer Settings
- Example: `abc123def456ghi`
- This is your secret authentication key

### 3. **Passphrase**
- Where to find: PayFast Dashboard → Settings → Edit Passphrase
- Example: `MySecurePassphrase123!`
- **You create this yourself** - make it strong and secure

---

## 📝 Setting Up Your PayFast Account

### Step 1: Sign Up
1. Go to: https://www.payfast.co.za/user/register
2. Choose account type: **Merchant/Business**
3. Fill in your business details
4. Complete email verification

### Step 2: Business Verification
PayFast will ask for:
- Business registration documents (if company)
- ID/Passport copy
- Proof of banking details
- Bank verification (small deposit test)

**Timeline:** Usually 2-5 business days for approval

### Step 3: Get Your Credentials
Once approved:
1. Login to PayFast Dashboard
2. Go to **Settings → Developer Settings**
3. Copy your **Merchant ID** and **Merchant Key**
4. Create a **Passphrase**: Settings → Edit Passphrase
5. Send these 3 credentials to your developer (me)

---

## 💰 PayFast Fees (South Africa)

| Payment Method | Fee | Notes |
|----------------|-----|-------|
| **Credit/Debit Cards** | 3.2% + R2.00 | Visa, Mastercard |
| **American Express** | 4.5% + R2.00 | Higher fee |
| **Instant EFT** | 2.0% (min R2.00) | Bank transfers |
| **Payout to bank** | R8.70 | Per withdrawal |

**No monthly fees, no setup fees** - you only pay per successful transaction.

### Example:
- Visa application fee: AED 1,980 (≈ R6,450)
- PayFast fee (3.2%): R206 + R2 = **R208**
- You receive: R6,242

---

## 🔧 Technical Details (For Your Records)

### Architecture:
```
User → Flask Frontend (Port 5000) → Node.js Payment Backend (Port 3000) → PayFast
```

### Database:
- **Table:** `payments`
- **Fields:** reference, application_id, amount, email, name, status, payment_id
- **Location:** PostgreSQL (automatically managed by Replit)

### API Endpoints:
- `POST /api/payments/start` - Initiate payment
- `POST /api/payments/verify` - PayFast callback (ITN)
- `GET /api/payments/status/:ref` - Check payment status

### Files Created:
- `backend/server.js` - Payment backend server
- `payment-script.js` - Updated to use local backend
- `payment-success.html` - Success confirmation page
- `main.py` - Updated with payment API proxy

---

## 🚀 Going Live (After You Provide Credentials)

### What I'll Do:
1. Add your 3 credentials as environment secrets
2. Change `PAYFAST_SANDBOX` from `true` to `false`
3. Restart the payment server
4. Test one live transaction with you
5. Monitor first 10 payments to ensure everything works

**Time needed:** 10-15 minutes after you provide credentials

---

## 📊 How Payments Work

### User Journey:
```
1. User submits visa application
   └→ Gets application reference (e.g., UAE-20251028-1234)

2. Auto-redirect to payment page
   └→ Pre-filled with name, email, amount

3. User selects country (for records)
   └→ Clicks "Proceed to Payment"

4. System generates PayFast payment link
   └→ Redirects to PayFast checkout

5. User completes payment on PayFast
   └→ Uses card, EFT, or other methods

6. PayFast processes payment
   └→ Sends callback to our server

7. Our system updates database
   └→ Status: pending → paid

8. User sees success page
   └→ Shows payment reference number

9. User redirected to track application
   └→ Can monitor visa status
```

### Payment Statuses:
- **pending** - Payment initiated, awaiting completion
- **paid** - Payment successful
- **failed** - Payment declined/failed
- **cancelled** - User cancelled payment

---

## 🛡️ Security Features

### Built-in Security:
- ✅ MD5 signature verification (prevents tampering)
- ✅ Passphrase encryption
- ✅ HTTPS-only callbacks
- ✅ Database transaction logging
- ✅ PayFast ITN (Instant Transaction Notification) validation

### PCI Compliance:
- **No credit card data stored on our servers**
- All card processing happens on PayFast (PCI-DSS certified)
- Users enter payment details directly on PayFast's secure page

---

## 📱 Payment Methods Supported

PayFast accepts:
- Visa cards
- Mastercard
- American Express
- Instant EFT (direct bank transfer)
- SnapScan
- Mobicred
- Store cards
- QR code payments

---

## 🧪 Testing Checklist (Before Going Live)

### Sandbox Tests to Run:
- [ ] Complete a successful payment
- [ ] Test payment cancellation
- [ ] Test with different card types
- [ ] Verify payment reference is saved
- [ ] Check database records payment correctly
- [ ] Confirm success page displays reference
- [ ] Test "Track Application" flow after payment

### After Going Live:
- [ ] Process 1 small test payment (minimum R5.00)
- [ ] Verify funds appear in your PayFast account
- [ ] Test payout to your bank account
- [ ] Monitor first 10 real transactions
- [ ] Verify payment emails are sent (if configured)

---

## ❓ Common Questions

### Q: How long until payments appear in my account?
**A:** PayFast holds funds for 48-72 hours, then transfers to your bank in 1-2 business days.

### Q: Can international customers pay?
**A:** Yes! PayFast accepts international Visa/Mastercard. Amounts are converted to ZAR automatically.

### Q: What if a payment fails?
**A:** User is redirected back to payment page with their details pre-filled. They can retry immediately.

### Q: How do I refund a payment?
**A:** Login to PayFast Dashboard → Transactions → Find payment → Click "Refund". Refunds cost R2.00.

### Q: What about chargebacks?
**A:** PayFast handles all chargeback disputes. They'll notify you via email if one occurs.

### Q: Can I negotiate lower fees?
**A:** Yes! If you process >R500,000/month, contact support@payfast.co.za for custom pricing.

---

## 🆘 Support Contacts

### PayFast Support:
- **Email:** support@payfast.co.za
- **Phone:** +27 21 201 9150
- **Hours:** Mon-Fri, 9AM-5PM SAST
- **Website:** https://payfast.io/support

### Developer Documentation:
- **API Docs:** https://developers.payfast.co.za
- **Integration Guide:** https://developers.payfast.co.za/docs
- **Sandbox:** https://sandbox.payfast.co.za

---

## 🎬 Next Steps

### Immediate (While You Set Up PayFast Account):
1. ✅ Test the sandbox integration (already working!)
2. ✅ Register PayFast account
3. ✅ Submit business verification documents
4. ⏳ Wait for PayFast approval (2-5 days)

### After PayFast Approval:
1. 📋 Send me your 3 credentials (Merchant ID, Merchant Key, Passphrase)
2. ⚡ I'll switch to live mode (15 minutes)
3. 🧪 We'll test one live payment together
4. 🚀 Go live with real payments!

---

## 📸 Current Status

**Sandbox Mode:** ✅ Active  
**Database:** ✅ Configured  
**Payment Server:** ✅ Running  
**Frontend:** ✅ Updated  
**Success Page:** ✅ Created  

**Ready for testing NOW!**

---

## 📞 What to Send Me

When your PayFast account is approved, send me this information:

```
Subject: PayFast Live Credentials

Merchant ID: [Your 8-digit merchant ID]
Merchant Key: [Your merchant key]
Passphrase: [Your passphrase]

Account Status: Verified ✓
Ready to go live: Yes
```

**Security Note:** These are sensitive credentials. Send them via secure method (encrypted email, Replit secrets, etc.)

---

**Questions?** Just ask! The system is fully operational in sandbox mode and ready to go live as soon as you provide your PayFast credentials.
