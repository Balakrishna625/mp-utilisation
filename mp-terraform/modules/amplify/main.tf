# IAM Role for Amplify to access CodeCommit
resource "aws_iam_role" "amplify_codecommit" {
  count = var.use_codecommit ? 1 : 0
  name  = "${var.project_name}-${var.environment}-amplify-codecommit"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "amplify_codecommit" {
  count = var.use_codecommit ? 1 : 0
  name  = "codecommit-access"
  role  = aws_iam_role.amplify_codecommit[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "codecommit:GitPull",
          "codecommit:GetBranch",
          "codecommit:GetCommit"
        ]
        Resource = var.repository_arn
      }
    ]
  })
}

# AWS Amplify App
resource "aws_amplify_app" "main" {
  name       = "${var.project_name}-${var.environment}"
  repository = var.repository_url

  # Use CodeCommit IAM role instead of access token
  iam_service_role_arn = var.use_codecommit ? aws_iam_role.amplify_codecommit[0].arn : null
  
  # Only use access_token for GitHub
  access_token = var.use_codecommit ? null : var.github_access_token

  # Build settings
  build_spec = file("${path.module}/amplify.yml")

  # Environment variables
  environment_variables = var.environment_variables

  # Enable auto branch creation
  enable_auto_branch_creation = false
  enable_branch_auto_build   = true
  enable_branch_auto_deletion = false

  # Platform
  platform = "WEB_COMPUTE"

  tags = {
    Name        = "${var.project_name}-${var.environment}"
    Environment = var.environment
  }
}

# Branch
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = var.branch_name

  # Framework
  framework = "Next.js - SSR"

  # Enable auto build
  enable_auto_build = true

  # Stages (PRODUCTION, BETA, DEVELOPMENT, EXPERIMENTAL)
  stage = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"

  # Environment variables can be overridden per branch
  environment_variables = var.branch_environment_variables

  tags = {
    Name   = "${var.project_name}-${var.environment}-${var.branch_name}"
    Branch = var.branch_name
  }
}

# Domain Association (Optional - uncomment if you have a custom domain)
# resource "aws_amplify_domain_association" "main" {
#   app_id      = aws_amplify_app.main.id
#   domain_name = var.custom_domain
#
#   # Subdomain settings
#   sub_domain {
#     branch_name = aws_amplify_branch.main.branch_name
#     prefix      = var.environment == "prod" ? "" : var.environment
#   }
#
#   # Wait for SSL certificate
#   wait_for_verification = true
# }
