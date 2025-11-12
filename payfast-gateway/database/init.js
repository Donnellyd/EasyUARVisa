/**
 * Database Initialization Script
 * Creates the payments table if it doesn't exist
 */

const { Pool } = require('pg');
require('dotenv').config();

async function initDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            reference VARCHAR(255) UNIQUE NOT NULL,
            application_id VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'ZAR',
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            country VARCHAR(100),
            status VARCHAR(50) DEFAULT 'pending',
            payment_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
        CREATE INDEX IF NOT EXISTS idx_payments_application_id ON payments(application_id);
        CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    `;
    
    try {
        await pool.query(createTableQuery);
        console.log('✅ Database initialized successfully');
        console.log('✅ Payments table created/verified');
        console.log('✅ Indexes created');
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        await pool.end();
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase };
