output "app_id" {
  description = "Amplify App ID"
  value       = aws_amplify_app.main.id
}

output "app_arn" {
  description = "Amplify App ARN"
  value       = aws_amplify_app.main.arn
}

output "default_domain" {
  description = "Amplify default domain"
  value       = aws_amplify_app.main.default_domain
}

output "branch_name" {
  description = "Amplify branch name"
  value       = aws_amplify_branch.main.branch_name
}
