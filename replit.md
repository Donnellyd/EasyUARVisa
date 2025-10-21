# Overview

UAE VISA is a Flask-based web application serving as the official UAE visa application portal. The application provides a complete user interface for visa applications, status tracking, and information display with a beautiful, professional design featuring UAE national colors.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application follows a traditional multi-page web architecture with separate HTML files for different functionalities:

- **Static HTML Structure**: Three main pages (index.html, application.html, status.html) providing home, application form, and status tracking functionality
- **Client-Side JavaScript**: Separate JavaScript files handle form validation, data persistence using localStorage, and interactive features
- **CSS Styling**: Custom CSS with CSS variables for consistent theming using UAE national colors and modern design patterns
- **Responsive Design**: Bootstrap 5.1.3 integration for responsive layout with custom styling overlays

## Data Management
- **Local Storage**: Client-side data persistence for form progress saving and recent applications tracking
- **Demo Data**: Hardcoded sample data in JavaScript for status tracking demonstration
- **Form Validation**: Client-side validation with custom rules and error messaging system

## User Interface Design
- **UAE Color Theme**: Design system exclusively using UAE national colors (red, green, white, black, grey) - NO BLUE
- **Black Header**: Professional black navigation header with UAE flag icon
- **Red Accent Pricing**: All visa prices displayed in red (#c8102e) for emphasis
- **Dark Grey Headings**: Main headings and text in dark grey (#333333) for readability
- **Black Buttons & Icons**: All call-to-action buttons and service icons use black gradient
- **Clean Hero Section**: Full Sheikh Zayed Grand Mosque background without card overlay
- **Progressive Enhancement**: Base functionality works without JavaScript, enhanced with interactive features
- **Accessibility**: Semantic HTML structure with proper form labels and ARIA attributes

## File Organization
- **Separation of Concerns**: HTML structure, CSS styling, and JavaScript functionality are properly separated
- **Modular JavaScript**: Different scripts for application logic (script.js) and status tracking (status-script.js)
- **Asset Management**: External fonts (Google Fonts) and icons (Font Awesome) loaded via CDN

# External Dependencies

## CDN Resources
- **Google Fonts**: Inter font family for typography
- **Font Awesome 6.0.0**: Icon library for UI elements
- **Bootstrap 5.1.3**: CSS framework for responsive grid and components

## Browser APIs
- **Local Storage API**: For client-side data persistence
- **DOM API**: For dynamic content manipulation and form handling
- **Form Validation API**: For input validation and error handling

## Development Tools
- **Replit Environment**: Hosted development environment with automatic deployment
- **Flask Backend**: Python-based web framework serving the application
- **Gunicorn**: Production-ready WSGI server

## Recent Changes (October 21, 2025)

### Design Updates
- Removed Tourist Visa card from hero section for cleaner design
- Eliminated all blue colors from the application - pure UAE color scheme
- Changed all main headings to dark grey (#333333)
- Buttons and icons changed from red back to black for professional look
- Visa prices remain in red for visual emphasis
- Clean, unobstructed Sheikh Zayed Grand Mosque hero background

### Form Improvements
- Removed Marital Status field from application form
- Removed Nationality field from application form
- Renamed "Passport Copy" upload to "Photo of Applicant"
- Added new document upload fields: "Airline Confirmation" and "Hotel Booking"
- Added light green success indicator when documents are uploaded
- Removed days/time estimates from processing options (now shows "Standard", "Express", "Urgent")

## Backend Integration

The application is now integrated with the DubaiVisaAI backend portal:

### SDK Integration
- **SDK File**: `static/visa-portal-sdk.js` - Dubai Visa Portal SDK for backend communication
- **API Base URL**: `https://workspace.duane16.repl.co`
- **Features**: Real-time application submission, status tracking, document uploads, payment processing

### Application Submission
- Form submissions now go directly to the DubaiVisaAI backend via SDK
- Generates real application numbers from the backend
- Automatic document upload after successful submission
- Supports 4 document types: passport photo, passport copy, airline confirmation, hotel booking

### Status Tracking
- Real-time status checking using email and passport number
- Auto-refresh every 30 seconds for live updates
- Maps backend status to visual timeline
- Status types: open, captured, submitted, processing, approved, declined

### Data Flow
1. **Form Submission**: User fills application → SDK sends to backend → Returns application number
2. **Document Upload**: Files stored locally → Uploaded to backend via SDK after submission
3. **Status Check**: User enters email + passport → SDK queries backend → Displays real-time status
4. **Auto-Refresh**: Status page automatically checks for updates every 30 seconds

The system no longer relies on localStorage for submissions - all data is managed by the DubaiVisaAI backend.