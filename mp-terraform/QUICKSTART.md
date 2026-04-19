# Quick Start Guide

## Prerequisites Checklist

- [ ] AWS CLI installed (`brew install awscli`)
- [ ] AWS credentials configured (`aws configure`)
- [ ] Terraform installed (`brew install terraform`)
- [ ] Git installed (`brew install git`)

## 5-Minute Deployment

### 1. Navigate to Terraform Directory
```bash
cd mp-terraform
```

### 2. Configure Your Settings
```bash
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

Update these values:
```hcl
owner_email      = "your-email@example.com"
repository_name  = "mp-utilisation"  # CodeCommit repo name
branch_name      = "main"
```

### 3. Use Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

Select:
1. Option 1: Initialize Terraform
2. Option 3: Apply deployment (will take 10-15 minutes)
3. Option 4: Show outputs (get your app URL and CodeCommit repo URL)

### 4. Push Your Code to CodeCommit

After Terraform completes, get the CodeCommit URL:
```bash
terraform output codecommit_clone_url
```

Configure Git credentials for CodeCommit (only needed once):
```bash
# Install git-remote-codecommit
pip3 install git-remote-codecommit

# Or configure AWS CLI credential helper
git config --global credential.helper '!aws codecommit credential-helper $@'
git config --global credential.UseHttpPath true
```

Push your code:
```bash
cd /Users/bala/Downloads/mp-utilisation
git init
git add .
git commit -m "Initial commit"
git remote add origin <CODECOMMIT_URL_FROM_OUTPUT>
git push -u origin main
```

Amplify will automatically detect the push and start building your app.

### 5. Run Database Migration

Once the build completes:
```bash
cd mp-terraform
./deploy.sh
# Select Option 5: Run database migration
```

### 6. Access Your App

Your app will be available at:
```
https://main.xxxxxxxxxx.amplifyapp.com
```

## What Gets Created?

| Resource | Purpose | Time to Create |
|----------|---------|----------------|
| VPC + Subnets | Network isolation | ~2 min |
| NAT Gateways | Private subnet outbound access | ~3 min |
| RDS PostgreSQL | Database | ~5-8 min |
| Amplify App | Next.js hosting | ~2 min |
| Security Groups | Network security | ~1 min |
| Secrets Manager | Credential storage | ~1 min |

## Estimated Monthly Cost

**~$50-70/month** for optimized setup with:
- RDS db.t4g.micro (ARM-based)
- 1 NAT Gateway (single availability zone)
- Amplify hosting
- 20GB storage

### High Availability Option

**Production with 2 AZs:**
- Add `availability_zones = ["us-east-1a", "us-east-1b"]` to variables
- Cost: ~$85-110/month (adds ~$35/month for second NAT Gateway)

## Common Issues

### "Access Denied" Error
```bash
# Check your AWS credentials
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

### CodeCommit Git Push Fails
```bash
# Install git-remote-codecommit (recommended)
pip3 install git-remote-codecommit

# Test connection
aws codecommit get-repository --repository-name mp-utilisation

# Check IAM permissions - your user needs codecommit:GitPush
```

### Amplify Build Fails
- Check build logs in AWS Console → Amplify
- Verify DATABASE_URL is set correctly
- Ensure `package.json` has all dependencies

## Next Steps After Deployment

1. **Verify Deployment**
   - Visit your Amplify URL
   - Check that the application loads

2. **Switch from Supabase to RDS** (if applicable)
   - See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for complete instructions
   - Just update `DATABASE_URL` environment variable in Amplify
   - Takes ~5 minutes, no code changes needed!

3. **Run Database Migration**
   - Use `./deploy.sh` option 5
   - Or manually run with DATABASE_URL

4. **Set Up Custom Domain** (optional)
   - See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Part 4
   - Add your domain in Amplify console
   - Free SSL certificate included
   - Takes ~15-30 minutes

## Support

See [README.md](README.md) for detailed documentation.

## Cleanup

To remove all resources and stop billing:
```bash
./deploy.sh
# Select option 6: Destroy infrastructure
```

⚠️ This cannot be undone!
