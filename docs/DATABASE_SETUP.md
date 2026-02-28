# Database Setup & Migration Guide

## 🚀 Quick Start (Supabase)

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in and create a new project
3. Wait ~2 minutes for provisioning

### 2. Get Connection Strings

In Supabase Dashboard:
- Go to **Project Settings** → **Database**

**Connection Pooling (for DATABASE_URL):**
- Tab: **Connection Pooling**
- Mode: **Session mode**
- Copy the **URI**

**Direct Connection (for DIRECT_URL):**
- Tab: **Connection String**
- Mode: **Transaction mode**  
- Copy the **URI**

### 3. Update `.env` File

```env
# Pooled connection (for app queries)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-region.compute-1.amazonaws.com:5432/postgres"
```

**Replace:**
- `[PROJECT-REF]` with your project reference
- `[PASSWORD]` with your database password
- `region` with your actual region (e.g., us-west-1)

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push

# Or use migrations (production-ready)
npx prisma migrate dev --name init
```

### 5. Verify Connection

```bash
# Test database connection
npx prisma studio
```

---

## 🔄 Migration to AWS RDS (When Ready)

### Step 1: Export Data from Supabase

```bash
# Using Prisma
npx prisma db pull

# Or using pg_dump
pg_dump "postgresql://postgres.[REF]:[PASS]@aws-0-region.compute-1.amazonaws.com:5432/postgres" > supabase_backup.sql
```

### Step 2: Create AWS RDS Instance

1. AWS Console → RDS → Create Database
2. Choose **PostgreSQL**
3. Template: **Free tier** or **Production**
4. Instance: **db.t4g.micro** (cheapest)
5. Storage: **20 GB** (minimum)
6. Enable **Public Access** (for external connection)
7. Create database

### Step 3: Update `.env`

```env
# Simply replace with RDS endpoint
DATABASE_URL="postgresql://postgres:[PASSWORD]@your-rds-endpoint.rds.amazonaws.com:5432/mp_utilization"
DIRECT_URL="postgresql://postgres:[PASSWORD]@your-rds-endpoint.rds.amazonaws.com:5432/mp_utilization"
```

### Step 4: Import Data to RDS

```bash
# Run migrations on RDS
npx prisma migrate deploy

# Or import backup
psql "postgresql://postgres:[PASS]@your-rds-endpoint.rds.amazonaws.com:5432/mp_utilization" < supabase_backup.sql
```

### Step 5: Deploy to AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify init
amplify add hosting

# Deploy
git push origin main
```

---

## 📊 Database Schema

### Tables Created:
- `users` - Employee profiles
- `monthly_utilization` - Monthly utilization records
- `badge_history` - Achievement badges
- `mp_projects` - Project information
- `project_resources` - Project-user assignments
- `employee_availability` - Availability reports
- `upload_metadata` - File upload tracking

---

## 🔧 Useful Commands

```bash
# View database in browser
npx prisma studio

# Generate Prisma Client (after schema changes)
npx prisma generate

# Push schema changes (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name add_new_field

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

---

## 🎯 Zero Code Changes Needed!

The beauty of this architecture:
- ✅ Prisma handles database differences
- ✅ Same code works with Supabase & RDS
- ✅ Only change: `DATABASE_URL` in `.env`
- ✅ All queries are database-agnostic

---

## 🆘 Troubleshooting

### Connection Error
```
Error: P1001 Can't reach database
```
**Fix:** Check firewall rules, ensure database is publicly accessible

### Migration Error
```
Error: P3009 Migrations are out of sync
```
**Fix:** Run `npx prisma migrate resolve --applied [migration-name]`

### SSL Error with Supabase
**Fix:** Add `?sslmode=require` to connection string

---

## 📝 Environment Variables Reference

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Pooled connection for queries | Yes |
| `DIRECT_URL` | Direct connection for migrations | Recommended |
| `NODE_ENV` | Environment mode | Auto-set |

---

Ready to proceed? Provide your Supabase connection details!
