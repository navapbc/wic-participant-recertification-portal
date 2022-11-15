locals {
  # Machine readable project name (lower case letters, dashes, and underscores)
  project_name = "wic-prp"

  # Project owner
  owner = "navapbc"

  # URL of project source code repository
  code_repository_url = "https://github.com/navapbc/wic-participant-recertification-portal"

  # Default AWS region for project (e.g. us-east-1, us-east-2, us-west-1)
  default_region = "us-east-1"

  github_actions_role_name = "${local.project_name}-github-actions"
}
