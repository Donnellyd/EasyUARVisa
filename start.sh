#!/bin/bash

# Start Node.js payment backend in the background
echo "Starting Payment Backend on port 3000..."
node backend/server.js &

# Wait a moment for backend to initialize
sleep 2

# Start Flask frontend
echo "Starting Flask Frontend on port 5000..."
gunicorn --bind 0.0.0.0:5000 --reuse-port main:app
