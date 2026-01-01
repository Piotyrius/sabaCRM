# Database Setup Instructions

## Step 1: Install PostgreSQL

If you don't have PostgreSQL installed:
- Download from: https://www.postgresql.org/download/windows/
- Or use a package manager: `choco install postgresql` (if you have Chocolatey)

## Step 2: Create Database

1. Open PostgreSQL command line or pgAdmin
2. Create a new database:
```sql
CREATE DATABASE sabacrm;
```

Or using command line:
```bash
psql -U postgres
CREATE DATABASE sabacrm;
\q
```

## Step 3: Update .env File

Update your `.env` file with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/sabacrm?schema=public"
```

**Example:**
- If your PostgreSQL username is `postgres` and password is `mypassword`:
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/sabacrm?schema=public"
```

## Step 4: Push Database Schema

Run this command to create all tables:
```bash
npx prisma db push
```

## Step 5: Create Admin User

After the database is set up, run:
```bash
npm run create-admin
```

This will create an admin user with:
- **Email**: admin@sabacrm.com
- **Password**: admin123
- **Role**: ADMIN

## Alternative: Use SQLite for Testing

If you don't want to set up PostgreSQL, you can use SQLite for testing:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```env
DATABASE_URL="file:./dev.db"
```

3. Run:
```bash
npx prisma db push
npm run create-admin
```

