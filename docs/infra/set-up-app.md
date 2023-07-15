# Set up application

> Note: This is (ideally) a process that you'll only need to run one time to set up cross-application resources.

This process will create infrastructure resources needed:

1. To store built release candidate artifacts used to deploy applications to an environment.
2. To configure an [web application firewall](https://aws.amazon.com/waf) to protect the applications.
3. To send emails to WIC staff to access the staff portal.

## Prerequisites

This guide assumes you have already gone through the [AWS account setup](./set-up-aws-account.md).

## Instructions

For each of these terraform modules, perform the following steps (i.e. do this 3 times):

- `/infra/app/build-repository`
- `/infra/app/app-waf`
- `/infra/app/app-email`

### 1. Review the backend resources that will be created

Open a terminal and cd into the above directory and run the following commands:

```bash
terraform init
terraform plan -out=plan.out
```

Review the plan to make sure that the resources look correct.

### 2. Create the backend resources

```bash
terraform apply plan.out
```

Once these steps are complete, this should not need to be touched again.

## Set up application environments

Once you set up the deployment process, you can proceed to [set up application environments](./set-up-app-env.md)
