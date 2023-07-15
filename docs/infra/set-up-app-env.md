# Set up application environments

> Note: This is (ideally) a process that you'll only need to run one time to set up cross-application resources.

This repo has configured three environments (listed in order of lowest to highest):

1. `dev`
2. `staging`
3. `prod`

All three environments rely on a shared child module `/infra/app/env-template`.

## Prerequisites

This guide assumes you have already gone through the [application setup](./set-up-app.md).

## Instructions

For each of these terraform modules, perform the following steps (i.e. do this 3 times):

- `/infra/app/envs/dev`
- `/infra/app/envs/staging`
- `/infra/app/envs/prod`

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

You will need to run these instructions any time you make changes to your environment application infrastructure.