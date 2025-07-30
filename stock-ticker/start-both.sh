#!/bin/bash

echo "🚀 Starting Stock Ticker App..."
echo "================================"

# Kill any existing processes on these ports
echo "Stopping existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Backend failed to start. Check backend.log for details."
    exit 1
fi

echo "✅ Backend running on http://localhost:3001"

# Start frontend in background
echo "Starting frontend server..."
cd ../frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to compile
echo "⏳ Waiting for frontend to compile..."
sleep 10

echo ""
echo "🎮 Stock Ticker App is ready!"
echo "================================"
echo "Backend:  http://localhost:3001/health"
echo "Frontend: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "Backend:  tail -f backend.log"
echo "Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers"

# Keep script running and show logs (if they exist)
if [ -f backend.log ] && [ -f frontend.log ]; then
    tail -f backend.log frontend.log
else
    echo "✅ Both servers are running!"
    echo ""
    echo "🌐 Open http://localhost:3000 in your browser to play!"
    echo ""
    # Just wait for Ctrl+C
    while true; do
        sleep 1
    done
fi