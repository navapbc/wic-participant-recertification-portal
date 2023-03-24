# Analytics using Matomo

For this project, we used [matomo](https://matomo.org), a privacy-forward alternative to Google Analytics. See @TODO ADR for reasons why we chose to do so.

## Local development

For local development, there is a `docker-compose.yml` file that will set up a [mysql](https://hub.docker.com/_/mysql) database and an instance of [matomo](https://hub.docker.com/_/matomo).

### First time setup

Matomo does not support automated installation. Instead, a human must manually walk through the browser installer the first time. In addition, the easiest way to work with Matomo on a development machine is to allow it to run on port 80.

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

To deploy to AWS, we use ECS Fargate to host the matomo server and an Aurora mysql database.

### First time setup

For each environment, do the following:

1. Use terraform to deploy the environment as usual (see @TODO documentation)
2. Navigate to the AWS Console for [ECS clusters](https://us-west-2.console.aws.amazon.com/ecs/v2/clusters?region=us-west-2) for the region you have deployed your environment to
  1. Click on the cluster for the environment you are setting up
  2. Click on the `analytics` service
  3. Click on the "Networking" tab
  4. Click on the "open address" link in the "DNS names" section
3. Walk through the installation wizard to install the database tables and setup the configuration file

## Notes

- Although Matomo does not support automated installation, there is [active discussion](https://github.com/matomo-org/matomo/issues/10257#issuecomment-1039352193) about ways to accomplish this. We chose not to pursue this path for this project because, after some experimentation, we believed it was too risky to setup procedures that could result in accidentally wiping out the database.
- Matomo can be further tuned in many ways, including setting up a [crontab for faster report-loading](https://matomo.org/docs/setup-auto-archiving/) and [tuning mysql performance](https://matomo.org/faq/troubleshooting/faq_194/).
