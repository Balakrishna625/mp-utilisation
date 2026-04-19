# Pre-Deployment Checklist

Use this checklist to ensure a smooth deployment.

## Phase 1: Prerequisites

### AWS Setup
- [ ] AWS account created
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS credentials configured (`aws configure`)
- [ ] IAM user has sufficient permissions:
  - [ ] VPC management
  - [ ] RDS management
  - [ ] Amplify management
  - [ ] Secrets Manager access
  - [ ] IAM role creation
  - [ ] CloudWatch management

### Tools Installation
- [ ] Terraform installed (`terraform --version` should show >= 1.5.0)
- [ ] jq installed for JSON parsing (`brew install jq`)
- [ ] Node.js installed (for Prisma migrations)
- [ ] Git installed

### GitHub Setup
- [ ] Code committed to GitHub repository
- [ ] Repository is accessible
- [ ] Personal Access Token created with `repo` scope
- [ ] Token tested and valid

## Phase 2: Configuration

### Terraform Variables
- [ ] Copied `terraform.tfvars.example` to `terraform.tfvars`
- [ ] Updated `owner_email` in `terraform.tfvars`
- [ ] Updated `github_repository_url` in `terraform.tfvars`
- [ ] Updated `github_branch_name` in `terraform.tfvars`
- [ ] Reviewed and adjusted instance sizes if needed
- [ ] Set GitHub token in environment: `export TF_VAR_github_access_token="..."`

### Application Code
- [ ] Prisma schema is finalized
- [ ] All migrations are created locally
- [ ] `package.json` includes all dependencies
- [ ] Application builds successfully locally (`npm run build`)
- [ ] Environment variables documented

## Phase 3: Deployment

### Initial Deployment
- [ ] Navigated to `mp-terraform` directory
- [ ] Run `terraform init` successfully
- [ ] Run `terraform plan` and reviewed output
- [ ] Verified estimated costs are acceptable
- [ ] Run `terraform apply` and confirmed with 'yes'
- [ ] Deployment completed without errors (~10-15 minutes)
- [ ] Noted all outputs from `terraform output`

### Outputs to Save
```bash
terraform output > deployment-outputs.txt
```

Save these values:
- [ ] `amplify_app_url` - Your application URL
- [ ] `rds_endpoint` - Database endpoint
- [ ] `db_credentials_secret_arn` - Secrets Manager ARN
- [ ] `amplify_app_id` - For Amplify console access

## Phase 4: Database Setup

### Retrieve Database Credentials
```bash
SECRET_ARN=$(terraform output -raw db_credentials_secret_arn)
aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString --output text | jq -r '.password'
```

- [ ] Retrieved database password from Secrets Manager
- [ ] Constructed `DATABASE_URL` connection string
- [ ] Tested database connectivity

### Run Migrations
- [ ] Set `DATABASE_URL` environment variable
- [ ] Run `npx prisma migrate deploy` successfully
- [ ] Run `npx prisma generate` successfully
- [ ] Verified schema with `npx prisma studio` (optional)

## Phase 5: Verification

### Application Check
- [ ] Visited Amplify URL in browser
- [ ] Application loads without errors
- [ ] Can log in (if authentication is set up)
- [ ] Database connection works
- [ ] Can create/read data

### AWS Console Verification
- [ ] VPC created in AWS Console → VPC
- [ ] RDS instance shows "Available" in AWS Console → RDS
- [ ] Amplify app shows "Deployed" in AWS Console → Amplify
- [ ] Security groups configured correctly
- [ ] CloudWatch alarms created

### Monitoring Setup
- [ ] CloudWatch dashboard accessible
- [ ] Alarms configured:
  - [ ] CPU utilization
  - [ ] Free storage space
  - [ ] Database connections
- [ ] SNS topic for notifications (optional)
- [ ] Email subscriptions configured (optional)

## Phase 6: Security Review

### Network Security
- [ ] RDS is in private subnet (not publicly accessible)
- [ ] Security groups follow least-privilege principle
- [ ] NAT Gateways configured for private subnet outbound access
- [ ] No unnecessary ports open

### Data Security
- [ ] Database credentials stored in Secrets Manager (not hardcoded)
- [ ] RDS storage encryption enabled
- [ ] SSL/TLS enforced for database connections
- [ ] `terraform.tfvars` added to `.gitignore`
- [ ] No secrets committed to Git

### Access Control
- [ ] IAM roles follow least-privilege principle
- [ ] GitHub token has minimum required scopes
- [ ] AWS credentials rotated if shared

## Phase 7: Post-Deployment

### Documentation
- [ ] Documented the deployment date and version
- [ ] Saved all outputs in secure location
- [ ] Updated team documentation with URLs and access
- [ ] Created runbook for common operations

### Backup Strategy
- [ ] Verified automated backups are enabled (7 days retention)
- [ ] Tested restore procedure (optional)
- [ ] Documented backup/restore process

### Monitoring & Alerts
- [ ] Set up SNS notifications for alarms
- [ ] Test alarm notifications
- [ ] Set up log aggregation (optional)

### Optional Enhancements
- [ ] Custom domain configured in Amplify
- [ ] SSL certificate configured (automatic with Amplify)
- [ ] WAF rules configured (optional)
- [ ] Remote state backend configured (S3 + DynamoDB)
- [ ] Staging environment created

## Phase 8: Handoff

### Knowledge Transfer
- [ ] Deployment process documented
- [ ] Access credentials shared securely
- [ ] Monitoring dashboard shared
- [ ] Escalation procedures documented

### Operational Readiness
- [ ] Team trained on monitoring
- [ ] Incident response plan created
- [ ] Backup/restore tested
- [ ] Scaling procedures documented

## Troubleshooting

### Common Issues Encountered

#### Issue 1: [Describe issue]
- **Error**: 
- **Solution**:
- **Date Resolved**:

#### Issue 2: [Describe issue]
- **Error**:
- **Solution**:
- **Date Resolved**:

## Rollback Plan

If deployment fails or issues arise:

1. [ ] Identify the issue from error logs
2. [ ] Check Terraform state: `terraform show`
3. [ ] Attempt targeted fixes first
4. [ ] If needed, destroy and redeploy:
   ```bash
   terraform destroy
   terraform apply
   ```
5. [ ] Restore database from backup if data loss occurred

## Cost Monitoring

### Expected Costs
- **Daily**: ~$3-4
- **Weekly**: ~$20-25
- **Monthly**: ~$85-110

### Cost Monitoring
- [ ] Set up AWS Budgets alert
- [ ] Review AWS Cost Explorer weekly
- [ ] Identify cost optimization opportunities

## Sign-Off

### Deployment Team
- **Deployed by**: _______________
- **Date**: _______________
- **Environment**: Production / Staging / Development
- **Terraform Version**: _______________
- **AWS Region**: _______________

### Verification Sign-Off
- [ ] Technical Lead Approval: _______________
- [ ] Security Review Complete: _______________
- [ ] Production Ready: _______________

---

## Notes

Add any additional notes, issues, or observations here:

```

```
