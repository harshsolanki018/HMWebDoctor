# Environment Variables

Create .env.example only. Never commit .env.

## Server
NODE_ENV=development
PORT=5000
MONGODB_URI=
CLIENT_URL=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173
SCAN_TIMEOUT_MS=30000
MAX_SCAN_RESPONSE_BYTES=
MAX_LINK_CHECKS=
MAX_REDIRECTS=5
RATE_LIMIT_WINDOW_MS=
RATE_LIMIT_MAX=
LIGHTHOUSE_CHROME_PATH=

## Client
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:5173

Only keep variables that the implementation actually uses.
