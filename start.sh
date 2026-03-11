#!/bin/bash

echo "🚀 Starting ShopEZ Application..."

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please ensure MongoDB is installed and running."
    echo "Visit https://www.mongodb.com/try/download/community for MongoDB installation."
else
    echo "✅ MongoDB found"
fi

# Start backend
echo "📦 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "⚛️  Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

# Handle cleanup
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
