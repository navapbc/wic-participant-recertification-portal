# Analytics using Matomo

For this project, we used [matomo](https://matomo.org), a privacy-forward alternative to Google Analytics.

## Local development

For local development, there is a `docker-compose.yml` file that will set up a [mysql](https://hub.docker.com/_/mysql) database and an instance of [matomo](https://hub.docker.com/_/matomo).

### First time setup

Matomo does not support automated installation. Instead, a human must manually walk through the browser installer the first time.

1. Start docker
2. Run `docker compose up -d` and wait for the containers to be ready
3. Navigate to `localhost` in the browser
4. Walk through the installation wizard to install the database tables and setup the configuration file (found inside the container at `/var/www/html/config/config.ini.php`)
5. Stop the docker containers when you are done: `docker compose down`

### Regular usage

After the first time setup is complete, usage is as follows:

- Run `docker compose up -d` to start the database and the matomo container
- Run `docker compose down` when done
- To wipe out the database and start over, run `docker compose down -v --remove-orphans`. Walk through the first time setup to start over.

## Deploy to AWS

To deploy to AWS, we use ECS Fargate to host the matomo server, an Aurora mysql database, and an EFS docker volume for persistent files. Deploying to AWS required making some adjustments, including:

- The matomo image by default uses a privileged port (80), which causes issues on AWS ECS Fargate. This is addressed by building a Docker image that uses a `sed` command to change the apache port to 8080, but that can be adjusted with an environment variable.
- The matomo image is built on the PHP docker image which deploys using Apache. Apache needs to be able to write to `/var/www/html`. This results in a few changes:
  - Mapping an EFS docker volume to `/var/www/html`
  - Allowing non-read-only docker root volume
  - Allow the ECS task to have all EFS IAM permissions (a future @todo would be to refactor this to a more limited scope)

Notes:
- The ECS logs will show errors like: `Operation not permitted: AH02156: setgid: unable to set group id to Group 33`. This is because Apache will want to try to run SETGID, but because AWS ECS Fargate does not support privileged capabilities such as `SETGID`. See https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/security-tasks-containers.html#security-tasks-containers-recommendations-avoid-privileged-containers for more info. Instead, the EFS has been configured to automatically set posix uid and gid to 33 (e.g. the `www-data` user and group). See infra/modules/file-system/main.tf lines 39-48 and infra/app/env-template/main.tf lines 147-148.
- The Matomo system check will not return all results until DNS is configured because amazonaws.com is in the blocked hosts list. See https://github.com/matomo-org/matomo/blob/9cb2258632948a3dddc0da92f7d29239a8020b06/config/global.php#L221 This issue should resolve once DNS is configured.

### First time setup

For each environment, do the following:

1. Use terraform to deploy the environment as usual (see [documentation](../docs/infra)). For matomo, be sure to wait several minutes to allow the docker entrypoint to complete
2. Use the "Deploy" Github Action to build and deploy a docker image for matomo
3. Navigate to the AWS Console for [ECS clusters](https://us-west-2.console.aws.amazon.com/ecs/v2/clusters?region=us-west-2) for the region you have deployed your environment to
  1. Click on the cluster for the environment you are setting up
  2. Click on the `analytics` service
  3. Click on the "Networking" tab
  4. Click on the "open address" link in the "DNS names" section
  5. Walk through the installation wizard to install the database tables and setup the configuration file
4. (Optional) Apply any custom configuration needed, such as updating the `trusted_hosts[]` in `config/config.ini.php` using ECS Exec or terraform
5. Configure matomo settings in the browser, such as creating additional users or additional sites to track
6. Instrument analytics into the site(s) to track

## Notes

- Although Matomo does not support automated installation, there is [active discussion](https://github.com/matomo-org/matomo/issues/10257#issuecomment-1039352193) about ways to accomplish this. We chose not to pursue this path for this project because, after some experimentation, we believed it was too risky to setup procedures that could result in accidentally wiping out the database.
- Matomo can be further tuned in many ways, including setting up a [crontab for faster report-loading](https://matomo.org/docs/setup-auto-archiving/) and [tuning mysql performance](https://matomo.org/faq/troubleshooting/faq_194/).
