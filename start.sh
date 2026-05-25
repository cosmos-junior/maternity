#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  MaterniTrack — Quick Start Script
#  Starts both Django backend and React frontend
# ═══════════════════════════════════════════════════════════════

echo "🏥 Starting MaterniTrack..."
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Start Django backend ──────────────────────────────────────
echo "⚙️  Starting Django backend on http://127.0.0.1:8000 ..."
cd "$ROOT_DIR/backend"
source venv/bin/activate
python manage.py runserver &
DJANGO_PID=$!
echo "   Django PID: $DJANGO_PID"

# ─── Start React frontend ──────────────────────────────────────
echo "⚛️  Starting React frontend on http://localhost:5173 ..."
cd "$ROOT_DIR/frontend"
npm run dev &
VITE_PID=$!
echo "   Vite PID: $VITE_PID"

echo ""
echo "✅ MaterniTrack is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://127.0.0.1:8000"
echo "   Admin:    http://127.0.0.1:8000/admin"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $DJANGO_PID $VITE_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
