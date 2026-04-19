# CodeCommit Setup Guide

## Quick Setup (5 minutes)

### 1. Deploy Infrastructure First

```bash
cd mp-terraform
./deploy.sh
# Select: Initialize → Apply
```

### 2. Get Your CodeCommit Repository URL

After Terraform completes:
```bash
terraform output codecommit_clone_url
```

You'll see something like:
```
https://git-codecommit.us-east-1.amazonaws.com/v1/repos/mp-utilisation
```

### 3. Configure Git Credentials for CodeCommit

**Option A: Using git-remote-codecommit (Recommended)**
```bash
# Install the helper
pip3 install git-remote-codecommit

# No additional configuration needed - uses your AWS CLI credentials
```

**Option B: Using AWS CLI Credential Helper**
```bash
git config --global credential.helper '!aws codecommit credential-helper $@'
git config --global credential.UseHttpPath true
```

### 4. Push Your Application Code

```bash
# Navigate to your app directory
cd /Users/bala/Downloads/mp-utilisation

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Add CodeCommit as remote
git remote add origin <YOUR_CODECOMMIT_URL>

# Push to main branch
git push -u origin main
```

### 5. Watch Amplify Build Your App

```bash
# Get your Amplify URL
cd mp-terraform
terraform output amplify_app_url
```

Visit the URL or check AWS Console → Amplify to watch the build progress.

## Troubleshooting

### "fatal: Authentication failed"
```bash
# Verify your AWS credentials are working
aws sts get-caller-identity

# If using git-remote-codecommit, verify installation
pip3 show git-remote-codecommit

# If missing, install it
pip3 install git-remote-codecommit
```

### "The requested URL returned error: 403"
Your IAM user needs these permissions:
```json
{
  "Effect": "Allow",
  "Action": [
    "codecommit:GitPush",
    "codecommit:GitPull"
  ],
  "Resource": "arn:aws:codecommit:us-east-1:*:mp-utilisation"
}
```

### Check Repository Exists
```bash
aws codecommit get-repository --repository-name mp-utilisation
```

### View All CodeCommit Repositories
```bash
aws codecommit list-repositories
```

## Daily Workflow

After initial setup, your workflow is simple:

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push

# Amplify automatically builds and deploys!
```

## Alternative: Clone After Creation

If you haven't initialized git yet:

```bash
# Clone the empty repo
git clone <YOUR_CODECOMMIT_URL> mp-utilisation-new

# Copy your app files into it
cp -r /Users/bala/Downloads/mp-utilisation/* mp-utilisation-new/

# Push
cd mp-utilisation-new
git add .
git commit -m "Initial commit"
git push
```

## Checking Build Status

### Via Command Line
```bash
aws amplify list-apps
aws amplify list-branches --app-id <YOUR_APP_ID>
```

### Via AWS Console
1. Open https://console.aws.amazon.com/amplify
2. Click your app
3. View build logs and deployment status

## Cleanup

To remove everything:
```bash
cd mp-terraform
terraform destroy -auto-approve
```

This deletes:
- CodeCommit repository (and all code in it!)
- Amplify app
- RDS database
- VPC and all networking
