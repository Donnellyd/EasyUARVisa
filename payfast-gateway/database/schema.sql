-- ===============================================
-- PayFast Payment Gateway - Database Schema
-- ===============================================
-- PostgreSQL schema for payment tracking
-- ===============================================

-- Drop existing table if it exists (be careful in production!)
-- DROP TABLE IF EXISTS payments;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Payment reference (unique identifier)
    reference VARCHAR(255) UNIQUE NOT NULL,
    
    -- Application/order reference
    application_id VARCHAR(255) NOT NULL,
    
    -- Payment amount and currency
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ZAR',
    
    -- Customer details
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    
    -- Payment status: 'pending', 'paid', 'failed', 'cancelled'
    status VARCHAR(50) DEFAULT 'pending',
    
    -- PayFast payment ID (received from ITN callback)
    payment_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON payments(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- ===============================================
-- NOTES:
-- ===============================================
-- 1. Run this schema when setting up a new database
-- 2. The 'reference' field is the unique payment identifier
-- 3. The 'payment_id' is populated by PayFast via ITN callback
-- 4. Status values: pending, paid, failed, cancelled
-- ===============================================
