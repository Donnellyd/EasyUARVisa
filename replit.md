# Overview

UAE VISA is a Flask-based web application serving as the official UAE visa application portal. It provides a comprehensive platform for visa applications, status tracking, and information display, designed with a professional aesthetic incorporating UAE national colors. The project integrates with the **dubai-visa-ai** backend (`https://dubai-visa-ai-duane16.replit.app`) for application processing and tracking, and includes integrated payment processing via multiple gateways (PayFast, PayGate, Peach Payments) directly within the Flask application.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a multi-page web architecture with dedicated HTML, CSS, and JavaScript files for various functionalities. It integrates Bootstrap 5.1.3 for responsive design and custom CSS for consistent theming based on UAE national colors. Client-side JavaScript handles form validation, data persistence via localStorage, and interactive elements.

## Data Management
Client-side data persistence for form progress and recent applications is managed using localStorage. Demo data is hardcoded for status tracking demonstrations, and comprehensive client-side form validation is implemented.

## User Interface Design
The design adheres strictly to a UAE national color palette (red, green, white, black, grey), avoiding blue. Key design elements include a black navigation header, red accents for pricing, dark grey headings, and black buttons and icons. The hero section features a clean Sheikh Zayed Grand Mosque background. The UI is built with progressive enhancement and accessibility in mind.

## File Organization
The project maintains a clear separation of concerns with HTML, CSS, and JavaScript files organized into distinct modules. Asset management utilizes CDNs for external fonts (Google Fonts) and icons (Font Awesome).

## Backend Integration
The application integrates with the **dubai-visa-ai** backend at `https://dubai-visa-ai-duane16.replit.app` for application submission, status tracking, and document uploads via the Dubai Visa Portal SDK. It features a fallback system that uses localStorage when the backend is unavailable, ensuring continuous functionality. Payment gateway integrations are handled directly within the Flask application.

## Payment Integration
Payment processing is a core feature supporting **multiple payment gateways** for South African visa applicants. The system auto-redirects users to a payment page after application submission, pre-filling applicant details. A payment fallback system ensures that payment intents are saved locally if the payment gateway is unavailable, allowing users to complete payment later.

### Country-Based Currency Conversion
The system uses the "country" field from the application form to determine payment currency:
- **South Africa**: Automatically converts AED to ZAR using live exchange rates (via exchangerate-api.com)
- **Other countries**: Displays AED pricing
- **Payment page display**: For South African applicants, ZAR amount is shown prominently in RED, with AED shown as small reference text. A clear notice states "You will be charged ZAR X.XX"

## Multi-Gateway Payment Architecture
All payment gateway integrations are implemented directly in the Flask application (port 5000) using Python. A PostgreSQL database tracks payment statuses across all gateways. Payment logic includes signature generation (MD5 for PayFast/PayGate, HMAC SHA-256 for Peach), API integration with each gateway, and webhook/callback handling.

### Supported Payment Gateways

1. **PayFast** (Sandbox Mode)
   - MD5 signature verification using URL-encoded values and lowercase (per PayFast official docs)
   - POST form submission to PayFast (form data uses raw values, browser handles encoding)
   - Return URL: `payment-success.html`
   - Signature calculation: URL-encode all values, convert to lowercase, then MD5 hash
   - Environment variables: `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX`

2. **PayGate** (Sandbox Mode - Uses PayFast Infrastructure)
   - MD5 signature verification using URL-encoded values and lowercase (same format as PayFast)
   - POST form submission to PayFast sandbox with PayGate credentials
   - Separate merchant account (different credentials than PayFast)
   - Return URL: `paygate-return.html`
   - Notify URL: `/api/paygate/verify`
   - Signature calculation: URL-encode all values, convert to lowercase, then MD5 hash
   - Environment variables: `PAYGATE_ID` (merchant ID), `PAYGATE_MERCHANT_KEY`, `PAYGATE_ENCRYPTION_KEY` (salt passphrase), `PAYGATE_SANDBOX`

3. **Peach Payments** (Test Mode)
   - HMAC SHA-256 signature verification
   - Hosted checkout integration
   - South Africa's leading payment gateway (2.95% card fees, 1.5% Pay by Bank)
   - Supports cards, Apple Pay, EFT, Capitec Pay, BNPL options
   - Return URL: `peach-return.html`
   - Environment variables: `PEACH_ENTITY_ID`, `PEACH_ACCESS_TOKEN`, `PEACH_TEST_MODE`
   - Result codes: 000.000.xxx or 000.100.xxx = success, 000.200.xxx = pending

### Database Schema
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(255) UNIQUE,
    application_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'ZAR',
    email VARCHAR(255),
    name VARCHAR(255),
    country VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    payment_id VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

# External Dependencies

## CDN Resources
- **Google Fonts**: Inter font family
- **Font Awesome 6.0.0**: Icon library
- **Bootstrap 5.1.3**: CSS framework

## Browser APIs
- **Local Storage API**: Client-side data persistence
- **DOM API**: Dynamic content manipulation
- **Form Validation API**: Input validation

## Development Tools
- **Replit Environment**: Hosted development
- **Flask Backend**: Python web framework
- **Gunicorn**: WSGI server

## Payment Gateways
- **PayFast**: Sandbox mode for testing
- **PayGate**: South African payment gateway
- **Peach Payments**: Leading SA gateway with multiple payment methods (cards, wallets, EFT)

## Backend Services
- **Flask Application**: Serves frontend and handles all payment gateway integrations (port 5000)
- **PostgreSQL**: Database for payment tracking
- **Flask-SQLAlchemy**: ORM for database interactions
- **Gunicorn**: Production WSGI server

## Environment Variables (Replit Secrets)
### PayFast
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_SANDBOX`

### PayGate (Uses PayFast Sandbox)
- `PAYGATE_ID` (Merchant ID: 10043233)
- `PAYGATE_MERCHANT_KEY` (Merchant Key: ldt9a8d3l0dhe)
- `PAYGATE_ENCRYPTION_KEY` (Salt Passphrase: Paygatetest7456)
- `PAYGATE_SANDBOX` (Set to 'true' for sandbox mode)

### Peach Payments
- `PEACH_ENTITY_ID`
- `PEACH_ACCESS_TOKEN`
- `PEACH_TEST_MODE`