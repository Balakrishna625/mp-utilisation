# AWS Amplify Deployment Guide

## 🚀 Deploy to AWS Amplify

This guide shows you how to deploy your Next.js app with database to AWS Amplify.

---

## Prerequisites

- ✅ GitHub/GitLab repository with your code
- ✅ AWS Account
- ✅ Database ready (Supabase initially, RDS later)

---

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add database support"
git push origin main
```

---

## Step 2: Create Amplify App

### Via AWS Console:

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **New app** → **Host web app**
3. Choose **GitHub** → Authorize
4. Select your repository and branch (`main`)
5. Click **Next**

### Configure Build Settings:

Amplify auto-detects Next.js. Verify the build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

---

## Step 3: Add Environment Variables

In Amplify Console → **App Settings** → **Environment variables**, add:

### For Supabase:

```
DATABASE_URL = postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres

DIRECT_URL = postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-region.compute-1.amazonaws.com:5432/postgres
```

### For AWS RDS (when ready):

```
DATABASE_URL = postgresql://postgres:[PASSWORD]@your-rds-endpoint.rds.amazonaws.com:5432/mp_utilization

DIRECT_URL = postgresql://postgres:[PASSWORD]@your-rds-endpoint.rds.amazonaws.com:5432/mp_utilization
```

---

## Step 4: Deploy

1. Click **Save and deploy**
2. Wait ~5 minutes for build to complete
3. Amplify provides a URL: `https://main.[app-id].amplifyapp.com`

---

## Step 5: Run Database Migrations

After first deployment:

### Option A: From Local Machine

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy
```

### Option B: Add to Build Settings

Update `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
        - npx prisma migrate deploy  # ← Add this
    build:
      commands:
        - npm run build
```

---

## 🔄 Switching from Supabase to RDS

### 1. Create RDS Instance

```bash
# Via AWS Console:
# RDS → Create Database → PostgreSQL
# Instance: db.t4g.micro
# Public access: Yes
# VPC: Same as Amplify (default VPC OK)
```

### 2. Update Security Group

Allow inbound PostgreSQL (port 5432) from:
- Your IP (for local access)
- `0.0.0.0/0` (or Amplify IP range for production)

### 3. Export from Supabase

```bash
pg_dump "postgresql://postgres.[REF]:[PASS]@aws-0-region.compute-1.amazonaws.com:5432/postgres" > backup.sql
```

### 4. Import to RDS

```bash
psql "postgresql://postgres:[PASS]@your-rds-endpoint.rds.amazonaws.com:5432/mp_utilization" < backup.sql
```

### 5. Update Amplify Environment Variables

In Amplify Console → Environment variables:

```
DATABASE_URL = postgresql://postgres:[PASSWORD]@your-rds-endpoint.rds.amazonaws.com:5432/mp_utilization

DIRECT_URL = postgresql://postgres:[PASSWORD]@your-rds-endpoint.rds.amazonaws.com:5432/mp_utilization
```

### 6. Redeploy

```bash
git commit --allow-empty -m "Switch to RDS"
git push origin main
```

**That's it!** Zero code changes needed. 🎉

---

## 💰 Cost Estimation

### Development (Supabase):
- Amplify Hosting: $0-5/month
- Supabase Free Tier: $0/month
- **Total: $0-5/month**

### Production (RDS):
- Amplify Hosting: $5-10/month
- RDS db.t4g.micro: $15/month
- **Total: $20-25/month**

---

## 🔧 Custom Domain

1. Amplify Console → **Domain management**
2. Add your domain (e.g., `mp-utilization.com`)
3. Follow DNS configuration steps
4. SSL certificate auto-provisioned

---

## 📊 Monitoring

Amplify provides:
- ✅ Build logs
- ✅ Access logs
- ✅ Performance metrics
- ✅ Alerts

Check: Amplify Console → **Monitoring**

---

## 🆘 Troubleshooting

### Build Fails

**Error:** `Prisma Client not generated`

**Fix:** Add to `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Database Connection Timeout

**Error:** `Can't reach database`

**Fix:** 
- Supabase: Check connection pooling is enabled
- RDS: Verify security group allows connections

### Environment Variables Not Working

**Fix:** Restart deployment after adding env vars:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Amplify app created
- [ ] Environment variables added
- [ ] First deployment successful
- [ ] Database migrations run
- [ ] Health check working: `/api/health`
- [ ] UI loads correctly
- [ ] Data saves to database

Test your deployment:
```
https://your-app.amplifyapp.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "latency": "45ms"
}
```

---

Ready to deploy! 🚀
