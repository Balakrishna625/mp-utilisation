terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Uncomment after first apply to enable remote state
  # backend "s3" {
  #   bucket         = "mp-utilisation-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "mp-utilisation-terraform-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = var.owner_email
    }
  }
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Avoid characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store DB credentials in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}-${var.environment}-db-credentials"
  description             = "Database credentials for MP Utilisation RDS"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = {
    Name = "${var.project_name}-${var.environment}-db-secret"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = module.rds.db_instance_endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

# VPC and Networking
module "vpc" {
  source = "./modules/networking"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
  azs          = var.availability_zones
}

# RDS PostgreSQL Database
module "rds" {
  source = "./modules/rds"

  project_name             = var.project_name
  environment              = var.environment
  db_name                  = var.db_name
  db_username              = var.db_username
  db_password              = random_password.db_password.result
  db_instance_class        = var.db_instance_class
  db_allocated_storage     = var.db_allocated_storage
  db_max_allocated_storage = var.db_max_allocated_storage
  db_backup_retention_days = var.db_backup_retention_days
  db_multi_az              = var.db_multi_az

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  app_security_group_id = module.vpc.app_security_group_id
}

# AWS CodeCommit Repository (No GitHub needed!)
resource "aws_codecommit_repository" "main" {
  repository_name = var.repository_name
  description     = "MP Utilisation application repository"

  tags = {
    Name = "${var.project_name}-${var.environment}-repo"
  }
}

# AWS Amplify for Next.js hosting (Using CodeCommit)
module "amplify" {
  source = "./modules/amplify"

  project_name        = var.project_name
  environment         = var.environment
  repository_url      = aws_codecommit_repository.main.clone_url_http
  repository_arn      = aws_codecommit_repository.main.arn
  branch_name         = var.branch_name
  use_codecommit      = true
  github_access_token = ""  # Not used with CodeCommit
  
  # Environment variables for the app
  environment_variables = {
    DATABASE_URL = "postgresql://${var.db_username}:${random_password.db_password.result}@${module.rds.db_instance_endpoint}/${var.db_name}?schema=public&sslmode=require"
    NODE_ENV     = var.environment == "prod" ? "production" : "development"
  }

  depends_on = [module.rds, aws_codecommit_repository.main]
}
