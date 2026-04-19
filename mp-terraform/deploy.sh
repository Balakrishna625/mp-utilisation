#!/bin/bash

# MP Utilisation - AWS Deployment Script
# This script helps deploy the application to AWS using Terraform

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists terraform; then
    print_error "Terraform is not installed. Please install it first:"
    echo "  brew install terraform"
    exit 1
fi

if ! command_exists aws; then
    print_error "AWS CLI is not installed. Please install it first:"
    echo "  brew install awscli"
    exit 1
fi

if ! command_exists jq; then
    print_warning "jq is not installed. Installing it is recommended for easier secret retrieval:"
    echo "  brew install jq"
fi

# Check AWS credentials
print_info "Checking AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    print_error "AWS credentials are not configured. Run: aws configure"
    exit 1
fi
print_info "AWS credentials OK"

# Check if in correct directory
if [ ! -f "main.tf" ]; then
    print_error "This script must be run from the mp-terraform directory"
    exit 1
fi

# Check for terraform.tfvars
if [ ! -f "terraform.tfvars" ]; then
    print_warning "terraform.tfvars not found"
    echo ""
    echo "Creating terraform.tfvars from example..."
    cp terraform.tfvars.example terraform.tfvars
    print_warning "Please edit terraform.tfvars with your configuration:"
    echo "  - owner_email"
    echo "  - repository_name (CodeCommit repo name)"
    echo "  - branch_name (Git branch to deploy)"
    echo ""
    read -p "Press enter after updating terraform.tfvars..."
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

# Menu
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║   MP Utilisation - AWS Terraform Deployment      ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "What would you like to do?"
echo ""
echo "  1) Initialize Terraform (first time setup)"
echo "  2) Plan deployment (review changes)"
echo "  3) Apply deployment (create infrastructure)"
echo "  4) Show outputs (get URLs and endpoints)"
echo "  5) Run database migration"
echo "  6) Destroy infrastructure (cleanup)"
echo "  7) Exit"
echo ""
read -p "Enter your choice [1-7]: " choice

case $choice in
    1)
        print_info "Initializing Terraform..."
        terraform init
        print_info "Terraform initialized successfully!"
        ;;
    2)
        print_info "Planning deployment..."
        terraform plan
        ;;
    3)
        print_info "Applying deployment..."
        print_warning "This will create resources in AWS and may incur costs!"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            terraform apply
            print_info "Deployment complete!"
            echo ""
            print_info "Next steps:"
            echo "  1. Run: ./deploy.sh and select option 4 to see your app URL"
            echo "  2. Run: ./deploy.sh and select option 5 to migrate your database"
        else
            print_info "Deployment cancelled"
        fi
        ;;
    4)
        print_info "Getting outputs..."
        echo ""
        terraform output
        echo ""
        print_info "Application URL:"
        terraform output -raw amplify_app_url 2>/dev/null || echo "Not yet deployed"
        echo ""
        ;;
    5)
        print_info "Running database migration..."
        echo ""
        
        # Check if infrastructure is deployed
        if ! terraform output rds_endpoint >/dev/null 2>&1; then
            print_error "Infrastructure not deployed yet. Run option 3 first."
            exit 1
        fi
        
        # Get database credentials
        print_info "Retrieving database credentials from AWS Secrets Manager..."
        SECRET_ARN=$(terraform output -raw db_credentials_secret_arn)
        
        if command_exists jq; then
            DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text | jq -r '.password')
        else
            print_warning "jq not installed. Please manually extract password from:"
            aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text
            read -sp "Enter database password: " DB_PASSWORD
            echo ""
        fi
        
        # Construct DATABASE_URL
        DB_HOST=$(terraform output -raw rds_endpoint | cut -d':' -f1)
        DB_NAME=$(terraform output -raw rds_database_name)
        DATABASE_URL="postgresql://mpadmin:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?schema=public"
        
        print_info "Running Prisma migrations..."
        cd ..
        DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
        DATABASE_URL="$DATABASE_URL" npx prisma generate
        cd mp-terraform
        
        print_info "Database migration complete!"
        ;;
    6)
        print_warning "This will DESTROY all infrastructure!"
        print_warning "Your database will be deleted (a final snapshot will be taken if in prod)"
        echo ""
        read -p "Are you absolutely sure? Type 'destroy' to confirm: " confirm
        if [ "$confirm" = "destroy" ]; then
            terraform destroy
            print_info "Infrastructure destroyed"
        else
            print_info "Destruction cancelled"
        fi
        ;;
    7)
        print_info "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_info "Done!"
