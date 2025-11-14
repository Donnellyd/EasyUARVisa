# Overview

UAE VISA is a Flask-based web application serving as the official UAE visa application portal. It provides a comprehensive platform for visa applications, status tracking, and information display, designed with a professional aesthetic incorporating UAE national colors. The project aims to offer a seamless and secure visa application experience, leveraging a Node.js backend for robust payment processing via PayFast.

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
The application integrates with Dubai VISA AI backend (`https://dubai-visa-ai-duane16.replit.app`) for application submission, status tracking, and document uploads. 

### API Proxy Architecture
To resolve CORS issues and improve security, the Flask application acts as a proxy between the frontend and Dubai VISA AI backend:
- **Frontend** makes requests to `/api/website/*` (same domain, no CORS)
- **Flask proxy** forwards requests to Dubai VISA AI with X-API-Key authentication
- **API Key** is stored securely on the server (not exposed in browser)
- **Fallback system** uses localStorage when the backend is unavailable

### Security Features
- API key authentication via X-API-Key header
- Server-side request forwarding prevents API key exposure
- CORS enabled via flask-cors for cross-origin support
- Timeout protection (10 seconds) for backend requests

## Payment Integration
Payment processing is a core feature using **PayFast** for South African visa applicants. The system auto-redirects users to a payment page after application submission, pre-filling applicant details. A payment fallback system ensures that payment intents are saved locally if the payment gateway is unavailable, allowing users to complete payment later.

### Country-Based Currency Conversion
The system uses the "country" field from the application form to determine payment currency:
- **South Africa**: Automatically converts AED to ZAR using live exchange rates (via exchangerate-api.com)
- **Other countries**: Displays AED pricing
- **Payment page display**: For South African applicants, ZAR amount is shown prominently in RED, with AED shown as small reference text. A clear notice states "You will be charged ZAR X.XX"

## Payment Architecture
A dual-server setup is employed: a Flask frontend (port 5000) and a Node.js Express backend (port 3000) dedicated to PayFast payment gateway integration. A PostgreSQL database tracks payment statuses.

### PayFast Payment Gateway (Sandbox Mode)
- **Integration Method**: MD5 signature verification using PayFast's documented field order
- **Submission**: POST form submission to PayFast endpoint
- **Return URL**: `payment-success.html`
- **Credentials**: User's own sandbox account credentials
  - Merchant ID: 10043227
  - Merchant Key: j43ku45lk23vo
  - Passphrase: UAEVISAtest1820
- **Environment Variables**: `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX`
- **Important**: Must NOT use registration email in test transactions (PayFast requirement)

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

## Payment Gateway
- **PayFast**: Sandbox mode for testing with user's own sandbox account

## Backend Services
- **Node.js Express**: Dedicated backend for PayFast payment gateway integration (port 3000)
- **PostgreSQL**: Database for payment tracking

## Environment Variables (Replit Secrets)
### PayFast (Required)
- `PAYFAST_MERCHANT_ID` - User's PayFast sandbox merchant ID
- `PAYFAST_MERCHANT_KEY` - User's PayFast sandbox merchant key
- `PAYFAST_PASSPHRASE` - User's PayFast sandbox passphrase
- `PAYFAST_SANDBOX` - Set to "true" for sandbox mode

### Database (Auto-configured)
- `DATABASE_URL` - PostgreSQL connection string
- `PGDATABASE`, `PGHOST`, `PGPASSWORD`, `PGPORT`, `PGUSER` - PostgreSQL credentials

### Session Management
- `SESSION_SECRET` - Flask session encryption key

### Dubai VISA AI Integration (Required)
- `DUBAI_VISA_API_KEY` - API key for authenticating with Dubai VISA AI backend (365916b021f8584132e2fd5c95e60c0c61c21f3167f2fbc79b5f625d22c00059)