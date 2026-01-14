# SIGRA

## Development

- Start the backend: `cd backend && pnpm run dev` (or `node app.mjs` if you don't have pnpm).

### Troubleshooting
- If the server fails to start or APIs return connection errors, check the database:
  1. Ensure MySQL/MariaDB is installed and running (e.g., `systemctl status mysql` or start the service on Windows).
  2. Verify `.env` in `backend/` has correct credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT).
  3. Use `node backend/app.mjs` and visit `http://localhost:<PORT>/_status` to see DB connection status and last error.
  4. If DB is not initialized, create the database and run the seed script from `backend`:
     - `node database/seed/seed.database.mjs`
  5. When developing locally the frontend will show more detailed hints; in production those details are hidden from end users.

- Use the helper to start the backend and stream logs: `node scripts/dev/start_backend_dev.mjs`.
- On Windows you can double-click `start_backend.bat` or run it from PowerShell / CMD.
- Start the frontend: open `frontend/Modules/teaching-manager-IV/profesor.html` in a browser (or use the provided smoke runner).
