# Setup Guide - PayFast Payment Gateway

Complete step-by-step installation guide for deploying the PayFast payment gateway.

## 📋 Prerequisites

Before you start, make sure you have:

1. **Replit Account** (or any Node.js hosting)
2. **PostgreSQL Database** (Replit provides this automatically)
3. **PayFast Account** (https://sandbox.payfast.co.za for testing)

## 🚀 Installation Steps

### Step 1: Create a New Repl

1. Go to https://replit.com
2. Click "Create Repl"
3. Choose **Node.js** as the template
4. Name it something like "payfast-gateway"
5. Click "Create Repl"

### Step 2: Copy Files

1. Copy ALL files from the `payfast-gateway` folder
2. Paste them into your new Repl's root directory
3. Your file structure should look like:
   ```
   /
   ├── server.js
   ├── package.json
   ├── .env.example
   ├── config/
   ├── database/
   ├── routes/
   ├── utils/
   └── examples/
   ```

### Step 3: Set Up Database

1. In your Repl, go to the **Tools** panel
2. Click **Database**
3. Enable **PostgreSQL**
4. Replit will automatically create a `DATABASE_URL` secret

### Step 4: Configure Environment Variables

1. In your Repl, click the **Secrets** (lock icon) in the left sidebar
2. Add the following secrets:

#### Required Secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DATABASE_URL` | (auto-created by Replit) | PostgreSQL connection string |
| `PAYFAST_MERCHANT_ID` | `10000100` | Your PayFast merchant ID |
| `PAYFAST_MERCHANT_KEY` | `46f0cd694581a` | Your PayFast merchant key |
| `PAYFAST_PASSPHRASE` | `jt7NOE43FZPn` | Your PayFast passphrase |
| `PAYFAST_SANDBOX` | `true` | Use sandbox mode (testing) |

#### Optional Secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `APP_BASE_URL` | (leave empty) | Replit auto-detects this |
| `PORT` | `3000` | Server port (default: 3000) |

### Step 5: Get Your PayFast Credentials

#### For Testing (Sandbox):

Use the default credentials above. These are PayFast's test credentials:
- Merchant ID: `10000100`
- Merchant Key: `46f0cd694581a`
- Passphrase: `jt7NOE43FZPn`

#### For Production:

1. Go to https://www.payfast.co.za
2. Create an account (or login)
3. Go to **Settings** → **Integration**
4. Copy your:
   - Merchant ID
   - Merchant Key
   - Passphrase (create one if you haven't)
5. Update your secrets with these values
6. Set `PAYFAST_SANDBOX` to `false`

### Step 6: Install Dependencies

In the Repl's **Shell**, run:

```bash
npm install
```

This installs:
- `express` - Web server
- `cors` - Cross-origin support
- `pg` - PostgreSQL client
- `dotenv` - Environment variables

### Step 7: Initialize Database

Run the database initialization script:

```bash
npm run init-db
```

You should see:
```
✅ Database initialized successfully
✅ Payments table created/verified
✅ Indexes created
```

### Step 8: Start the Server

Start the payment gateway:

```bash
npm start
```

You should see:
```
==================================================
🚀 PayFast Payment Gateway Server
==================================================
📍 Server running on port 3000
🌐 Base URL: http://localhost:3000
🧪 PayFast Mode: SANDBOX
💳 Gateway: PayFast (South Africa)
==================================================
```

### Step 9: Configure Replit Workflow (Optional)

To make the server start automatically:

1. Create a `.replit` file in the root:
   ```
   run = "npm start"
   ```

2. Or configure it via the Replit UI:
   - Click **Configure**
   - Set Run Command to: `npm start`
   - Set Port to: `3000`

### Step 10: Test Your Gateway

Test the health endpoint:

1. Click the **Webview** in Replit
2. Navigate to: `/health`
3. You should see:
   ```json
   {
     "status": "ok",
     "service": "PayFast Payment Gateway",
     "version": "1.0.0",
     "payfast_mode": "sandbox",
     "gateway": "payfast"
   }
   ```

## ✅ Verification Checklist

Make sure everything is working:

- [ ] Database is enabled and `DATABASE_URL` secret exists
- [ ] All PayFast secrets are configured
- [ ] `npm install` completed successfully
- [ ] Database initialized (tables created)
- [ ] Server starts without errors
- [ ] `/health` endpoint returns OK status
- [ ] Sandbox mode is enabled for testing

## 🔧 Configuration Options

### Environment Variables Reference:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# PayFast Credentials
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn
PAYFAST_SANDBOX=true

# Application
APP_BASE_URL=https://your-app.replit.app
PORT=3000
```

### Sandbox vs Production:

| Mode | PAYFAST_SANDBOX | URL |
|------|----------------|-----|
| Testing | `true` | sandbox.payfast.co.za |
| Production | `false` | www.payfast.co.za |

## 🚨 Troubleshooting

### Database Connection Error

**Problem:** "Could not connect to database"

**Solution:**
1. Make sure PostgreSQL is enabled in Replit
2. Check that `DATABASE_URL` secret exists
3. Run `npm run init-db` again

### Server Won't Start

**Problem:** Port already in use

**Solution:**
1. Stop any other running servers
2. Change `PORT` in secrets to another port (e.g., 3001)
3. Restart the server

### PayFast Signature Errors

**Problem:** "Invalid signature"

**Solution:**
1. Make sure `PAYFAST_PASSPHRASE` is set correctly
2. Verify your merchant credentials
3. Check that you're using the correct sandbox/production mode

## 🎯 Next Steps

1. ✅ Gateway is installed and running
2. 📖 Read **API.md** for endpoint documentation
3. 💻 See **examples/integration-example.js** for integration code
4. 🧪 Test with PayFast sandbox
5. 🚀 Integrate with your application

## 📞 Need Help?

- PayFast Documentation: https://developers.payfast.co.za
- PayFast Support: https://www.payfast.co.za/support

---

**Installation complete!** Your PayFast payment gateway is ready to accept payments! 🎉
