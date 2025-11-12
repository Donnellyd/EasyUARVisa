# PayFast Payment Gateway

**Standalone payment processing server for South African payments using PayFast**

This is a complete, production-ready payment gateway service that you can deploy on Replit or any Node.js hosting platform. It handles payment initiation, verification, and status tracking for PayFast transactions.

## 🚀 Quick Start

1. **Create a new Repl** on Replit
2. **Copy all files** from this `payfast-gateway` folder to your new Repl
3. **Set up environment variables** (see SETUP.md)
4. **Run `npm install`** to install dependencies
5. **Run `npm run init-db`** to initialize the database
6. **Run `npm start`** to start the server
7. **Done!** Your payment gateway is ready

## ✨ Features

- ✅ **PayFast Integration** - Full PayFast payment processing (South Africa)
- ✅ **Signature Verification** - Secure MD5 signature generation and validation
- ✅ **Database Tracking** - PostgreSQL-based payment status tracking
- ✅ **ITN Webhook** - Automatic payment status updates via PayFast callbacks
- ✅ **Sandbox Mode** - Safe testing with PayFast sandbox environment
- ✅ **Production Ready** - Clean code, error handling, logging
- ✅ **Replit Optimized** - Works perfectly on Replit with auto-configuration

## 📋 What's Included

```
payfast-gateway/
├── server.js              # Main server (start here)
├── package.json           # Dependencies
├── .env.example           # Environment variable template
├── config/
│   └── payfast.js         # PayFast configuration
├── database/
│   ├── schema.sql         # Database schema
│   └── init.js            # Auto-initialization
├── routes/
│   └── payments.js        # Payment endpoints
├── utils/
│   └── signature.js       # Signature generation
├── examples/
│   └── integration-example.js  # How to integrate
└── docs/
    ├── README.md          # This file
    ├── SETUP.md           # Installation guide
    └── API.md             # API documentation
```

## 🔗 API Endpoints

- `POST /api/payments/start` - Initiate a new payment
- `POST /api/payments/verify` - PayFast ITN webhook
- `GET /api/payments/status/:reference` - Check payment status
- `GET /health` - Health check

See **API.md** for complete documentation with examples.

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Complete installation and configuration guide
- **[API.md](API.md)** - Full API documentation with code examples
- **[integration-example.js](examples/integration-example.js)** - Integration example

## 🔐 Security Features

- MD5 signature verification for all PayFast communications
- Environment-based configuration (no hardcoded secrets)
- SQL injection prevention via parameterized queries
- CORS support for secure cross-origin requests
- Passphrase support for enhanced security

## 🌍 Use Cases

Perfect for:
- E-commerce websites accepting South African payments
- Visa/permit application portals (like UAE VISA)
- Subscription services
- Booking/reservation systems
- Any application needing PayFast integration

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **PayFast API** - Payment gateway

## 💬 Support

For PayFast documentation and support:
- Sandbox: https://sandbox.payfast.co.za
- Production: https://www.payfast.co.za
- API Docs: https://developers.payfast.co.za

## 📝 License

MIT License - Free to use in your projects!

## 🎯 Next Steps

1. Read **SETUP.md** for installation instructions
2. Check **API.md** for endpoint documentation
3. See **examples/integration-example.js** for integration code
4. Deploy and start accepting payments!

---

**Ready to accept payments?** Follow the SETUP.md guide to get started! 🚀
