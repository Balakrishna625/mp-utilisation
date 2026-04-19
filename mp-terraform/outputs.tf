output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_instance_name
}

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "amplify_app_id" {
  description = "Amplify App ID"
  value       = module.amplify.app_id
}

output "amplify_default_domain" {
  description = "Amplify default domain"
  value       = module.amplify.default_domain
}

output "amplify_app_url" {
  description = "Amplify application URL"
  value       = "https://${var.branch_name}.${module.amplify.default_domain}"
}

output "codecommit_clone_url" {
  description = "CodeCommit repository clone URL (HTTPS)"
  value       = aws_codecommit_repository.main.clone_url_http
}

output "codecommit_repository_name" {
  description = "CodeCommit repository name"
  value       = aws_codecommit_repository.main.repository_name
}

output "database_connection_string" {
  description = "Database connection string (use for Prisma migrations)"
  value       = "postgresql://${var.db_username}:<PASSWORD>@${module.rds.db_instance_endpoint}/${var.db_name}?schema=public"
  sensitive   = true
}

output "database_migration_command" {
  description = "Command to run Prisma migrations"
  value       = "Retrieve password from AWS Secrets Manager and run: DATABASE_URL='postgresql://${var.db_username}:<PASSWORD>@${module.rds.db_instance_endpoint}/${var.db_name}?schema=public' npx prisma migrate deploy"
}
