# Quick Start Guide - Create Admin User

## Option 1: Use PostgreSQL (Recommended)

### Step 1: Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- During installation, remember the password you set for the `postgres` user

### Step 2: Create Database
Open Command Prompt or PowerShell and run:
```bash
psql -U postgres
```

Then in psql:
```sql
CREATE DATABASE sabacrm;
\q
```

### Step 3: Update .env File
Edit the `.env` file and update the DATABASE_URL:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sabacrm?schema=public"
```
Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

### Step 4: Setup Database
```bash
npx prisma db push
```

### Step 5: Create Admin User
```bash
npm run create-admin
```

**Admin Credentials:**
- Email: `admin@sabacrm.com`
- Password: `admin123`

---

## Option 2: Use Docker (Easiest)

If you have Docker installed:

### Step 1: Start PostgreSQL Container
```bash
docker run --name sabacrm-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sabacrm -p 5432:5432 -d postgres
```

### Step 2: Update .env File
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sabacrm?schema=public"
```

### Step 3: Setup Database
```bash
npx prisma db push
```

### Step 4: Create Admin User
```bash
npm run create-admin
```

---

## After Setup

1. Go to: http://localhost:3000/auth/login
2. Login with:
   - Email: `admin@sabacrm.com`
   - Password: `admin123`
3. You'll be redirected to the dashboard!

**⚠️ Important:** Change the admin password after first login!

