# Set up AWS account

> Note: This is (ideally) a process that you'll only need to run one time to set up your AWS account.

The AWS account setup process will:

1. Create the [Terraform backend](https://www.terraform.io/language/settings/backends/configuration) resources needed to store Terraform's infrastructure state files. The project uses an [S3 backend](https://www.terraform.io/language/settings/backends/s3).
2. Create the [OpenID connect provider in AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) to allow GitHub actions to access AWS account resources.

## Prerequisites

This guide assumes you have [set up infrastructure tools](./1-set-up-infrastructure-tools.md), like Terraform, AWS CLI, and AWS authentication.

## Overview of Terraform backend management

The approach to backend management allows Terraform to both create the resources needed for a remote backend as well as allow terraform to store that configuration state in that newly created backend. This also allows us to seperate infrastructure required to support terraform from infrastructure required to support the application. Because each backend, bootstrap or environment, stores their own terraform.tfstate in these buckets, ensure that any backends that are shared use a unique key. When using a non-default workspace, the state path will be `/workspace_key_prefix/workspace_name/key`, `workspace_key_prefix` default is `env:`

## Instructions

### 1. Use your AWS account

This repo was configured for our pilot. You will need to do a bulk find-and-replace:

- **`636249768232`:** Replace with your AWS account ID
- **`us-west-2`:** Replace with your AWS region
- **`wic-prp`:** Replace with your project name

### 2. Set up your project

Change all of the settings in `/infra/project-config/main.tf` and use your project settings:

```terraform
locals {
  # Machine readable project name (lower case letters, dashes, and underscores)
  project_name = "<YOUR_PROJECT_NAME>"

  # Project owner
  owner = "<YOUR_ORGANIZATION_NAME>"

  # URL of project source code repository
  code_repository_url = "<YOUR_CODE_REPO_URL>"

  # Default AWS region for project (e.g. us-west-1, us-east-2, us-west-1)
  default_region = "<YOUR_AWS_REGION>"

  github_actions_role_name = "${local.project_name}-github-actions"
}
```

These values will be used as tags for resources and variables for naming other resources.

### 3. Prepare the backend resources

You'll need to comment out the S3 bucket backend for your initial deploy because it doesn't exist yet.

In `infra/accounts/account/main.tf`, comment out the block that looks like this:

```terraform
  backend "s3" {
    bucket         = "wic-prp-636249768232-us-west-2-tf-state"
    dynamodb_table = "wic-prp-tf-state-locks"
    key            = "infra/account.tfstate"
    region         = "us-west-2"
    encrypt        = "true"
  }
```

### 4. Review the backend resources that will be created

Open a terminal and cd into your infra/accounts/account directory and run the following commands:

```bash
terraform init
terraform plan -out=plan.out
```

Review the plan to make sure that the resources look correct.

### 5. Create the backend resources

```bash
terraform apply plan.out
```

### 6. Reconfigure backend to use S3 backend

Now that the S3 bucket for storing Terraform state files and the DynamoDB table for managing tfstate locks have been created, reconfigure the backend in `main.tf` to use the S3 bucket as a backend. To do this, uncomment out the `backend "s3" {}` block and fill in the appropriate information from the outputs from the previous step.

```terraform
  # infra/accounts/account/main.tf

  backend "s3" {
    bucket         = "<TF_STATE_BUCKET_NAME>"
    dynamodb_table = "<TF_LOCKS_TABLE_NAME>"
    region         = "<REGION>"
    ...
  }
```

### 7. Copy local tfstate file to remote backend

Now run following command to copy the `terraform.tfstate` file from your local machine to the remote backend.

```bash
terraform init -force-copy
```

Once these steps are complete, this should not need to be touched again.

## Destroying infrastructure

To undeploy and destroy infrastructure, see [instructions on destroying infrastructure](./destroy-infrastructure.md).

## Next Up

You can now proceed to [setting up application](./2-set-up-app.md).