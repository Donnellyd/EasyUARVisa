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
The application integrates with a backend portal for application submission, status tracking, and document uploads. It features a fallback system that uses localStorage when the backend is unavailable, ensuring continuous functionality.

## Payment Integration
Payment processing is a core feature, integrated through PayFast. The system auto-redirects users to a payment page after application submission, pre-filling applicant details. A payment fallback system ensures that payment intents are saved locally if the payment gateway is unavailable, allowing users to complete payment later.

## PayFast Payment Gateway Architecture
A dual-server setup is employed: a Flask frontend (port 5000) and a Node.js Express backend (port 3000) dedicated to PayFast payment processing. A PostgreSQL database tracks payment statuses, and security features include MD5 signature verification. The system supports both sandbox and live modes, controlled by environment variables.

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
- **PayFast**: Primary payment processor.
  - Merchant ID, Merchant Key, Passphrase stored in Replit Secrets.
  - Sandbox and Live modes configurable via `PAYFAST_SANDBOX` environment variable.

## Backend Services
- **Node.js Express**: Dedicated backend for PayFast integration.
- **PostgreSQL**: Database for payment tracking.

## Environment Variables (Replit Secrets)
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_SANDBOX`