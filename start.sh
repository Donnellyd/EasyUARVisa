#!/bin/bash
set -e  # Exit on error

echo "=== Starting UAE Visa Application ==="
echo "Working directory: $(pwd)"

# Start Node.js payment backend in the background
echo "📦 Starting Payment Backend on port 3000..."
node backend/server.js &
BACKEND_PID=$!

# Give backend a moment to start
sleep 3

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Payment backend failed to start"
    exit 1
fi

echo "✅ Payment backend started (PID: $BACKEND_PID)"

# Start Flask frontend (this runs in foreground)
echo "🌐 Starting Flask Frontend on port 5000..."
exec gunicorn --bind 0.0.0.0:5000 --reuse-port main:app
