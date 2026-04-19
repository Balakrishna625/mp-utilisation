# Switching from Supabase to AWS RDS - Complete Guide

Your app is **already configured** to work with both Supabase and AWS RDS! The switch is literally just changing one environment variable. 🎉

## 📋 Quick Answer

### 1. **How easy to switch?**
**EXTREMELY EASY - 2 steps:**
1. Update `DATABASE_URL` environment variable in Amplify
2. Run database migration

**No code changes needed!** Your `lib/prisma.ts` already supports both.

### 2. **Does RDS support HTTPS?**
**YES - SSL/TLS is enabled by default and REQUIRED**
- RDS enforces encrypted connections
- Certificate is managed by AWS
- Your connection string automatically uses SSL

### 3. **How to add custom domain?**
**VERY EASY - 3 steps:**
1. Own a domain (or buy one in Route 53)
2. Configure in Amplify console
3. Update DNS records

---

## 🔄 Step-by-Step Migration Guide

### **Prerequisites**
- [ ] RDS deployed via Terraform (completed)
- [ ] Database credentials from Secrets Manager
- [ ] (Optional) Existing data in Supabase to migrate

---

## Part 1: Deploy RDS Infrastructure

### Step 1: Deploy with Terraform

```bash
cd mp-terraform
./deploy.sh
# Select: 1 (Initialize), then 3 (Deploy)
```

Wait 10-15 minutes for deployment.

### Step 2: Get Database Credentials

```bash
# Get the secret ARN
SECRET_ARN=$(terraform output -raw db_credentials_secret_arn)

# Retrieve credentials
aws secretsmanager get-secret-value \
  --secret-id $SECRET_ARN \
  --query SecretString \
  --output text | jq
```

You'll see:
```json
{
  "username": "mpadmin",
  "password": "xxxxxxxxxxxxx",
  "engine": "postgres",
  "host": "mp-utilisation-prod-db.xxxxx.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "mputilisation"
}
```

### Step 3: Construct RDS Connection String

Format:
```bash
postgresql://[username]:[password]@[host]:[port]/[dbname]?sslmode=require
```

Example:
```bash
postgresql://mpadmin:Abc123xyz@mp-utilisation-prod-db.xxxxx.us-east-1.rds.amazonaws.com:5432/mputilisation?sslmode=require
```

**Important:** Add `?sslmode=require` for SSL enforcement! ✅

---

## Part 2: Migrate Database Schema

### Option A: Fresh Start (No Existing Data)

```bash
# Set the RDS connection string
export DATABASE_URL="postgresql://mpadmin:PASSWORD@HOST:5432/mputilisation?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Done! ✅
```

### Option B: Migrate from Supabase (With Existing Data)

#### 1. Export Supabase Data

```bash
# Set Supabase URL
export SUPABASE_URL="postgresql://postgres.xxxxx:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Export schema and data
pg_dump "$SUPABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > supabase_backup_$(date +%Y%m%d).sql

# Verify backup
ls -lh supabase_backup_*.sql
```

#### 2. Prepare RDS Schema

```bash
# Set RDS URL
export DATABASE_URL="postgresql://mpadmin:PASSWORD@HOST:5432/mputilisation?sslmode=require"

# Deploy Prisma schema
npx prisma migrate deploy
```

#### 3. Import Data to RDS

```bash
# Import the backup
psql "$DATABASE_URL" < supabase_backup_20260419.sql

# Verify tables
psql "$DATABASE_URL" -c "\dt"
```

#### 4. Verify Data Migration

```bash
# Count records in key tables
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"MonthlyUtilization\";"

# Test Prisma Studio
npx prisma studio
```

---

## Part 3: Update Amplify Environment Variables

### Method 1: Via AWS Console (Easiest)

1. **Open Amplify Console:**
   ```
   AWS Console → Amplify → mp-utilisation-prod → Environment variables
   ```

2. **Update DATABASE_URL:**
   - Click "Manage variables"
   - Find `DATABASE_URL`
   - Update value to your RDS connection string:
     ```
     postgresql://mpadmin:PASSWORD@mp-utilisation-prod-db.xxxxx.us-east-1.rds.amazonaws.com:5432/mputilisation?sslmode=require
     ```
   - **Important:** Select "Store as secret" ✅
   - Save

3. **Redeploy:**
   - Go to "Deployments" tab
   - Click "Redeploy this version"
   - Wait ~5 minutes

### Method 2: Via Terraform (Better for IaC)

Update `mp-terraform/main.tf`:

```hcl
# AWS Amplify for Next.js hosting
module "amplify" {
  source = "./modules/amplify"

  # ... existing config ...
  
  # Update environment variables
  environment_variables = {
    DATABASE_URL = "postgresql://${var.db_username}:${random_password.db_password.result}@${module.rds.db_instance_endpoint}/${var.db_name}?schema=public&sslmode=require"
    NODE_ENV     = var.environment == "prod" ? "production" : "development"
  }
}
```

Apply:
```bash
terraform apply
```

Amplify will auto-redeploy with new variables.

---

## Part 4: Verify the Switch

### Test Database Connection

```bash
# Check Amplify build logs
# AWS Console → Amplify → Deployments → View build logs

# Look for:
✓ Database connection successful
✓ Prisma client initialized
```

### Test Application

1. Visit your Amplify URL
2. Try logging in (if auth is set up)
3. Create/read data
4. Check that data persists in RDS (not Supabase)

### Verify in Prisma Studio

```bash
export DATABASE_URL="postgresql://mpadmin:PASSWORD@HOST:5432/mputilisation?sslmode=require"
npx prisma studio
```

Browse your data in RDS!

---

## 🔒 SSL/TLS Configuration (HTTPS for Database)

### **Good News: It's Automatic!** ✅

**RDS PostgreSQL SSL is:**
- ✅ **Enabled by default**
- ✅ **Enforced** with `sslmode=require`
- ✅ **AWS-managed certificates** (auto-renewed)
- ✅ **No configuration needed**

### **Connection String SSL Modes:**

```bash
# RECOMMENDED - Require SSL but don't verify certificate
?sslmode=require

# MOST SECURE - Require SSL AND verify certificate
?sslmode=verify-full

# NOT RECOMMENDED - No SSL (insecure)
?sslmode=disable
```

**Use `sslmode=require` for your app.** ✅

### **Verify SSL is Active:**

```bash
psql "$DATABASE_URL" -c "SHOW ssl;"
```

Should show `on`.

### **Check Connection Security:**

```bash
psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_ssl WHERE pid = pg_backend_pid();"
```

Should show `ssl = t` (true).

---

## 🌐 Custom Domain Setup

### **Overview**

Default Amplify URL:
```
https://main.d3abc123456.amplifyapp.com  ❌ Long and ugly
```

Custom domain:
```
https://mp-utilisation.yourdomain.com  ✅ Professional
```

---

### **Step 1: Prerequisites**

**Option A: You Own a Domain Already**
- Domain registered anywhere (GoDaddy, Namecheap, Route 53, etc.)
- Access to DNS settings

**Option B: Register New Domain in Route 53**

```bash
# Search for available domain
aws route53domains check-domain-availability \
  --domain-name your-domain.com

# Register domain (costs $12-50/year depending on TLD)
aws route53domains register-domain \
  --domain-name your-domain.com \
  --duration-in-years 1 \
  --admin-contact ... \
  --registrant-contact ... \
  --tech-contact ...
```

---

### **Step 2: Add Domain in Amplify Console**

#### Via AWS Console (Easiest):

1. **Open Amplify:**
   ```
   AWS Console → Amplify → mp-utilisation-prod → Domain management
   ```

2. **Add Domain:**
   - Click "Add domain"
   - Enter your domain: `yourdomain.com`
   - Click "Configure domain"

3. **Configure Subdomains:**
   ```
   Production:  www.yourdomain.com  →  main branch
   Production:  yourdomain.com      →  main branch (root)
   ```

4. **SSL Certificate:**
   - Amplify automatically creates SSL certificate (via ACM)
   - Takes 5-10 minutes
   - **Free and auto-renews!** ✅

5. **DNS Configuration:**
   - Amplify will show you DNS records to add
   - Copy these for next step

---

### **Step 3: Configure DNS**

#### **Option A: Domain in Route 53 (Easiest)**

**Amplify can auto-configure!** ✅

1. In Amplify domain setup, select "Route 53 hosted zone"
2. Click "Update DNS records automatically"
3. Done! ✅

#### **Option B: External Domain (GoDaddy, Namecheap, etc.)**

**Manually add DNS records:**

1. Log into your domain registrar
2. Go to DNS settings
3. Add the CNAME records Amplify provided:

   | Type  | Name | Value |
   |-------|------|-------|
   | CNAME | www | xxxxxx.cloudfront.net |
   | CNAME | @ or apex | xxxxxx.amplifyapp.com |

4. Save and wait 5-60 minutes for DNS propagation

---

### **Step 4: Wait for SSL Certificate**

**Amplify will:**
1. Request SSL certificate from AWS ACM
2. Validate domain ownership (automatic if Route 53)
3. Issue certificate (5-10 minutes)
4. Configure HTTPS

**Status Check:**
```
AWS Console → Amplify → Domain management → View status
```

When you see: ✅ **Available** - You're done!

---

### **Step 5: Verify Custom Domain**

```bash
# Test DNS resolution
dig www.yourdomain.com

# Test HTTPS
curl -I https://www.yourdomain.com

# Visit in browser
open https://www.yourdomain.com
```

Should show:
- ✅ SSL certificate valid
- ✅ Redirects HTTP → HTTPS automatically
- ✅ Your Next.js app loads

---

### **Via Terraform (Advanced)**

Add to `mp-terraform/modules/amplify/main.tf`:

```hcl
# Custom Domain (uncomment and configure)
resource "aws_amplify_domain_association" "main" {
  app_id      = aws_amplify_app.main.id
  domain_name = "yourdomain.com"

  # Subdomain for production branch
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"  # www.yourdomain.com
  }

  # Root domain
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""  # yourdomain.com
  }

  wait_for_verification = true
}

# Output the domain
output "custom_domain" {
  value = aws_amplify_domain_association.main.domain_name
}
```

Add variable in `mp-terraform/variables.tf`:

```hcl
variable "custom_domain" {
  description = "Custom domain name"
  type        = string
  default     = ""  # Set in terraform.tfvars
}
```

Update `mp-terraform/terraform.tfvars`:

```hcl
custom_domain = "yourdomain.com"
```

Deploy:

```bash
terraform apply
```

---

## 📊 Complete Migration Checklist

### Phase 1: Pre-Migration
- [ ] RDS deployed via Terraform
- [ ] Database credentials retrieved from Secrets Manager
- [ ] RDS connection string constructed with `sslmode=require`
- [ ] (Optional) Supabase data exported

### Phase 2: Database Setup
- [ ] Prisma migrations deployed to RDS
- [ ] (Optional) Data imported from Supabase
- [ ] Database verified via Prisma Studio
- [ ] SSL connection verified

### Phase 3: Application Update
- [ ] Amplify `DATABASE_URL` updated to RDS connection string
- [ ] Environment variable stored as secret in Amplify
- [ ] Application redeployed
- [ ] Build logs checked for errors

### Phase 4: Verification
- [ ] Application loads successfully
- [ ] Can read/write data
- [ ] Data persists in RDS
- [ ] Old Supabase connection stopped

### Phase 5: Custom Domain (Optional)
- [ ] Domain registered/available
- [ ] Domain added in Amplify
- [ ] DNS records configured
- [ ] SSL certificate issued
- [ ] Custom domain accessible via HTTPS

---

## 💰 Cost Comparison

| Item | With Supabase | With RDS | Difference |
|------|---------------|----------|------------|
| **Database** | Free (500MB limit) | ~$15/month | +$15 |
| **Scalability** | Limited | Auto-scales to 50GB | Better |
| **Control** | Shared | Dedicated | Better |
| **Performance** | Shared resources | Dedicated | Better |
| **Backups** | 7 days | 7 days configurable | Same |

**RDS is worth it when:**
- You exceed Supabase free tier (500MB)
- Need guaranteed performance
- Want full control over database
- Running production workloads

---

## 🚨 Common Issues & Solutions

### Issue 1: SSL Connection Error

**Error:**
```
Error: self signed certificate in certificate chain
```

**Solution:**
Add `?sslmode=require` to connection string (not `verify-full`).

### Issue 2: Connection Timeout

**Error:**
```
Error: connect ETIMEDOUT
```

**Solution:**
- Check RDS security group allows traffic from Amplify
- Verify RDS is in correct VPC subnet
- Check NAT Gateway is running

### Issue 3: Build Fails After Update

**Error:**
```
Prisma Client could not connect to database
```

**Solution:**
- Verify `DATABASE_URL` is set correctly in Amplify
- Check password doesn't have special characters that need escaping
- Ensure `sslmode=require` is in connection string

### Issue 4: Custom Domain Not Working

**Error:**
```
DNS_PROBE_FINISHED_NXDOMAIN
```

**Solution:**
- Wait 30-60 minutes for DNS propagation
- Verify CNAME records are correct
- Check domain is not already in use by another app
- Ensure SSL certificate shows "Available" in Amplify

---

## 🔄 Rollback Plan

If migration fails, easily rollback to Supabase:

```bash
# In Amplify Console → Environment variables
# Change DATABASE_URL back to Supabase connection string
DATABASE_URL=postgresql://postgres.xxxxx@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Redeploy
# Your app will reconnect to Supabase immediately
```

**No data loss because you kept Supabase running during migration!**

---

## 🎯 Summary

### **Switching to RDS:**
✅ **2 steps** - Update environment variable + run migration  
✅ **No code changes** needed  
✅ **~5 minutes** of work  
✅ **SSL enabled** by default  

### **Custom Domain:**
✅ **3 steps** - Add domain + configure DNS + wait for SSL  
✅ **Free SSL certificate** (auto-renews)  
✅ **~15-30 minutes** total time  

### **Total Migration Time:**
- Database switch: ~10 minutes
- Custom domain: ~30 minutes
- **Total: ~40 minutes!**

---

## 📚 Additional Resources

- [AWS RDS SSL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)
- [Amplify Custom Domains](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html)
- [Prisma Connection Strings](https://www.prisma.io/docs/reference/database-reference/connection-urls)

---

**Your app is ready for the switch! 🚀**
