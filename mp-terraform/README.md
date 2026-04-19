# MP Utilisation - AWS Deployment with Terraform

This directory contains Terraform Infrastructure as Code (IaC) for deploying the MP Utilisation application to AWS with the following components:

- **VPC** with public and private subnets (single or multi-AZ)
- **RDS PostgreSQL** database in private subnet
- **AWS CodeCommit** for Git repository hosting
- **AWS Amplify** for hosting the Next.js application
- **Security Groups** with least-privilege access
- **Secrets Manager** for secure credential storage
- **CloudWatch Alarms** for monitoring

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **Terraform** installed (v1.5.0 or later)
   ```bash
   brew install terraform
   ```

3. **Git** installed
   ```bash
   brew install git
   ```

4. **Python 3** (for CodeCommit helper)
   ```bash
   pip3 install git-remote-codecommit
   ```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              CodeCommit Repository                     │ │
│  │         mp-utilisation (Git hosting)                   │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │ Auto-deploy on push                 │
│  ┌────────────────────▼──────────────────────────────────┐  │
│  │                    Amplify (Next.js)                   │ │
│  │                  https://app.amplify...                │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼──────────────────────────────────┐  │
│  │                  VPC (10.0.0.0/24)                    │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │         Private Subnet (10.0.10.0/24)           │ │  │
│  │  │                                                  │ │  │
│  │  │  ┌────────────────────────────────────────────┐ │ │  │
│  │  │  │   RDS PostgreSQL (db.t4g.micro ARM)       │ │ │  │
│  │  │  │   - Storage: 20GB (auto-scaling to 50GB)  │ │ │  │
│  │  │  │   - Backups: 7 days                        │ │ │  │
│  │  │  │   - Encrypted at rest                      │ │ │  │
│  │  │  └────────────────────────────────────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │         Public Subnet (10.0.0.0/25)             │ │  │
│  │  │         NAT Gateway                              │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Secrets Manager (DB Credentials)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

**See [QUICKSTART.md](QUICKSTART.md) for detailed step-by-step instructions.**

### 1. Configure Variables

```bash
cd mp-terraform

# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars
```

Update the following in `terraform.tfvars`:
- `owner_email`: Your email address
- `repository_name`: CodeCommit repo name (default: `mp-utilisation`)
- `branch_name`: Branch to deploy (default: `main`)

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review what will be created
terraform plan

# Deploy (takes ~10-15 minutes)
terraform apply
```

### 3. Push Code to CodeCommit

After infrastructure is deployed:

```bash
# Get your CodeCommit URL
terraform output codecommit_clone_url

# Install git helper (one-time setup)
pip3 install git-remote-codecommit

# Push your code
cd /Users/bala/Downloads/mp-utilisation
git init
git add .
git commit -m "Initial commit"
git remote add origin <YOUR_CODECOMMIT_URL>
git push -u origin main
```

**See [CODECOMMIT_SETUP.md](CODECOMMIT_SETUP.md) for detailed Git configuration.**

### 4. Run Database Migration

```bash
cd mp-terraform
./deploy.sh
# Select Option 5: Run database migration
```

### 5. Access Your App

```bash
terraform output amplify_app_url
```

Visit the URL to see your deployed application!
- 2 NAT Gateways
- 1 RDS instance
- 1 Amplify app
- Security groups, route tables, etc.

### 5. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. This will take **10-15 minutes** to complete.

### 6. Get Outputs

After deployment completes:

```bash
terraform output
```

Save these outputs:
- `amplify_app_url`: Your application URL
- `rds_endpoint`: Database endpoint
- `db_credentials_secret_arn`: ARN of the credentials in Secrets Manager

## Database Migration

After infrastructure is deployed, run Prisma migrations:

### 1. Get Database Password

```bash
# Get the secret ARN from terraform output
SECRET_ARN=$(terraform output -raw db_credentials_secret_arn)

# Retrieve the password
aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString --output text | jq -r '.password'
```

### 2. Set DATABASE_URL

```bash
# Get RDS endpoint
DB_HOST=$(terraform output -raw rds_endpoint | cut -d':' -f1)

# Set the DATABASE_URL (replace <PASSWORD> with the password from step 1)
export DATABASE_URL="postgresql://mpadmin:<PASSWORD>@${DB_HOST}/mputilisation?schema=public"
```

### 3. Run Migrations

```bash
# Navigate to your project root
cd ..

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 4. Verify Migration

```bash
npx prisma studio
```

This opens a GUI to verify the database schema.

## Amplify Deployment

AWS Amplify will automatically:
1. Detect the Next.js framework
2. Run `npm ci` and `npm run build`
3. Deploy the application

### Monitor Build

```bash
# Get the app ID
APP_ID=$(terraform output -raw amplify_app_id)

# Open Amplify console
aws amplify get-app --app-id $APP_ID
```

Or visit the AWS Console → Amplify → Your App → Builds

## Environment Variables

The following environment variables are automatically configured in Amplify:
- `DATABASE_URL`: Connection string to RDS
- `NODE_ENV`: Set to `production`

To add more variables:

1. Update `main.tf` in the `module "amplify"` section:
```hcl
environment_variables = {
  DATABASE_URL = "..."
  NODE_ENV     = "..."
  MY_NEW_VAR   = "my_value"  # Add here
}
```

2. Apply changes:
```bash
terraform apply
```

## Cost Estimation

**Monthly costs (approximate, us-east-1 region):**

| Resource | Configuration | Estimated Cost |
|----------|--------------|----------------|
| RDS (db.t3.micro) | 20GB storage | ~$15-20/month |
| NAT Gateways (2) | Standard | ~$65/month |
| Amplify Hosting | Build minutes + hosting | ~$0-15/month* |
| Data Transfer | Varies | ~$5-10/month |
| **Total** | | **~$85-110/month** |

*Amplify has 1000 free build minutes/month and 5GB free hosting

### Cost Optimization Tips

1. **Development Environment**: Use single NAT Gateway
   ```hcl
   # In terraform.tfvars
   availability_zones = ["us-east-1a"]  # Single AZ
   ```

2. **Remove NAT Gateways**: Make RDS publicly accessible (not recommended for production)
   ```hcl
   # In terraform.tfvars - Add to RDS module
   publicly_accessible = true
   ```

3. **Smaller RDS**: Stick with db.t3.micro for small workloads

## Monitoring & Alarms

CloudWatch alarms are automatically created for:
- CPU Utilization (>80%)
- Free Storage Space (<5GB)
- Database Connections (>80)

View alarms:
```bash
aws cloudwatch describe-alarms --alarm-name-prefix mp-utilisation
```

## Backup & Recovery

**Automated Backups:**
- Retention: 7 days
- Backup window: 03:00-04:00 UTC
- Maintenance window: Monday 04:00-05:00 UTC

**Manual Snapshot:**
```bash
DB_ID=$(terraform output -raw rds_endpoint | cut -d'.' -f1)
aws rds create-db-snapshot \
  --db-instance-identifier $DB_ID \
  --db-snapshot-identifier mp-util-manual-$(date +%Y%m%d)
```

## Scaling

### Vertical Scaling (RDS)

Update `terraform.tfvars`:
```hcl
db_instance_class = "db.t3.small"  # or db.t3.medium
```

Then apply:
```bash
terraform apply
```

### Horizontal Scaling (Multi-AZ)

```hcl
db_multi_az = true
```

## Security Best Practices

✅ Implemented:
- [ ] Database in private subnet
- [ ] Encrypted storage (RDS)
- [ ] Secrets Manager for credentials
- [ ] Security groups with least privilege
- [ ] CloudWatch logging enabled

⚠️ Additional recommendations:
- [ ] Enable AWS WAF for DDoS protection
- [ ] Set up CloudTrail for audit logging
- [ ] Configure SNS for alarm notifications
- [ ] Enable GuardDuty for threat detection
- [ ] Use custom domain with ACM certificate

## Remote State Management (Optional but Recommended)

After initial deployment, enable remote state:

### 1. Create S3 Bucket and DynamoDB Table

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket mp-utilisation-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket mp-utilisation-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name mp-utilisation-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Uncomment Backend Configuration

Edit `main.tf` and uncomment the backend block:

```hcl
backend "s3" {
  bucket         = "mp-utilisation-terraform-state"
  key            = "prod/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "mp-utilisation-terraform-lock"
}
```

### 3. Migrate State

```bash
terraform init -migrate-state
```

## Troubleshooting

### Amplify Build Fails

1. Check build logs in AWS Console → Amplify
2. Verify `DATABASE_URL` is correctly set
3. Ensure all dependencies are in `package.json`
4. Check `amplify.yml` build commands

### Database Connection Issues

1. Verify security groups allow traffic
2. Check DATABASE_URL format
3. Ensure RDS is in "Available" state
4. Test connection from local machine (if publicly accessible)

### Terraform Apply Fails

1. Check AWS credentials: `aws sts get-caller-identity`
2. Verify sufficient IAM permissions
3. Check for naming conflicts
4. Review error message for specific resource

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

⚠️ **Warning**: This will:
- Delete the RDS database (final snapshot will be taken if environment is `prod`)
- Remove all networking components
- Delete the Amplify app

## Support & Documentation

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Amplify Hosting](https://docs.aws.amazon.com/amplify/)
- [RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## Module Structure

```
mp-terraform/
├── main.tf                 # Main infrastructure configuration
├── variables.tf            # Variable definitions
├── outputs.tf              # Output definitions
├── terraform.tfvars        # Your variable values (git-ignored)
├── terraform.tfvars.example # Example variable values
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── modules/
    ├── networking/         # VPC, subnets, security groups
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── rds/                # RDS PostgreSQL database
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── amplify/            # AWS Amplify hosting
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── amplify.yml     # Build configuration
```

## Next Steps

After successful deployment:

1. [ ] **Switch from Supabase to RDS** - See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
   - Update DATABASE_URL in Amplify
   - Run migrations
   - ~5 minutes, no code changes!

2. [ ] **Set up custom domain** - See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
   - Free SSL certificate included
   - ~15-30 minutes setup

3. [ ] Set up SNS for CloudWatch alarm notifications
4. [ ] Configure application monitoring (e.g., New Relic, Datadog)
5. [ ] Add staging environment (duplicate with `environment = "staging"`)
6. [ ] Document runbook for common operations

---

**Questions or Issues?** Open an issue or contact your DevOps team.
