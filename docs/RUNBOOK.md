# Day-0 Shield | Operations & Production Runbook

Operational procedures and administration commands for managing the Day-0 Shield service.

---

## Service Management

### Local Development Startup
```bash
# Backend (FastAPI + Worker)
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload

# Frontend Development (Vite)
cd frontend
npm run dev
```

### Docker Container Deployment
```bash
# Build standalone container
docker build -t day0-shield:latest .

# Run standalone container on port 8080
docker run -d --name day0-shield -p 8080:8080 --env-file .env day0-shield:latest
```

---

## Credential & Security Rotation

### Generating Password Hashes (Argon2id)
To generate a secure hash for the `admin` operator or new accounts:
```bash
python -c "from argon2 import PasswordHasher; ph = PasswordHasher(); print(ph.hash('YOUR_NEW_PASSWORD'))"
```

### Rotating PayPal Sandbox Credentials
1. Generate new Sandbox REST credentials in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox).
2. Update `.env`:
   ```env
   PAYPAL_CLIENT_ID="<new_client_id>"
   PAYPAL_CLIENT_SECRET="<new_client_secret>"
   ```
3. Restart the uvicorn process or container to reload the credentials cache.

### Rotating Session SECRET_KEY
1. Generate a 256-bit cryptographic key:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
2. Update `SECRET_KEY` in `.env` and restart. Note that active user sessions will be invalidated and require re-login.

---

## Diagnostics & Database Maintenance

### Database Backup & Reset
- **SQLite Database Path:** `backend/data/day0_shield.db`
- **Backup Command:**
  ```bash
  cp backend/data/day0_shield.db backend/data/day0_shield.backup.db
  ```
- **Reset to Demo State:**
  ```bash
  rm backend/data/day0_shield.db
  python -m app.core.init_db
  ```
