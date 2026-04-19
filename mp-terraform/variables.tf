variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "mp-utilisation"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "owner_email" {
  description = "Email of the project owner for tagging"
  type        = string
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/24"  # 256 IPs - plenty for small app
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a"]  # Single AZ for cost savings (saves ~$32/month on NAT)
}

# RDS Configuration
variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "mputilisation"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "mpadmin"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"  # ARM-based, 20% cheaper than db.t3.micro

  validation {
    condition     = can(regex("^db\\.", var.db_instance_class))
    error_message = "Instance class must start with 'db.'"
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "db_multi_az" {
  description = "Enable multi-AZ deployment for high availability"
  type        = bool
  default     = false
}

# Amplify Configuration - Using AWS CodeCommit
variable "repository_name" {
  description = "CodeCommit repository name"
  type        = string
  default     = "mp-utilisation"
}

variable "branch_name" {
  description = "Branch to deploy"
  type        = string
  default     = "main"
}
