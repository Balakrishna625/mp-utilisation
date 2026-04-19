variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "repository_url" {
  description = "Repository URL (CodeCommit or GitHub)"
  type        = string
}

variable "repository_arn" {
  description = "CodeCommit repository ARN (only needed for CodeCommit)"
  type        = string
  default     = ""
}

variable "use_codecommit" {
  description = "Whether to use CodeCommit (true) or GitHub (false)"
  type        = bool
  default     = true
}

variable "github_access_token" {
  description = "GitHub personal access token (only needed for GitHub)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "branch_name" {
  description = "Git branch to deploy"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for the application"
  type        = map(string)
  default     = {}
}

variable "branch_environment_variables" {
  description = "Branch-specific environment variables"
  type        = map(string)
  default     = {}
}

variable "custom_domain" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}
