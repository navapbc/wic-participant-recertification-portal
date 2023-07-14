# Development

This application can be run directly on a developer's computer, or in a parallel to the deployment environments it can be run in [Docker](docker.com/). The object storage and relational database needs could be served by any compatible solution, but by default are run using [Docker Compose](https://docs.docker.com/compose/) in containers.

These instructions will assume you are using a MacOS or Linux computer with a shell like Bash or Zsh, and access to the command-line via Terminal / iTerm / Xterm

## Prerequisites

- 💻 Items marked with a 💻 are for development on the application **outside** of the Docker container.
- 📦 Items marked with a 📦 are for development on the application **inside** a Docker container.
- 💻📦 Items marked with both are requirements for **both** (running the application inside or outside of Docker).

Supporting services (Minio, Postgres) run inside of Docker for both cases

### 💻📦 Docker

The easiest way to install Docker on your laptop or desktop is to use [Docker Desktop](https://www.docker.com/).

Follow the instructions and install Docker Desktop, then start it.

### 💻 NPM / NVM and NodeJS

#### Installing NVM

Documentation for NPM indicates a preference to use NVM to manage versions of Node.

You can install it [directly by following the instructions](https://github.com/nvm-sh/nvm) on the Github repository

You could also utilize [Brew](https://brew.sh/) on MacOS by running `brew install nvm` on the command line (after installing Brew)

#### Using NVM to install NodeJS

1.  Open your command line utility
2.  Change directories to the `participant` folder `cd participant`
3.  Install Node using `nvm install v19.1.0`
4.  Instruct NVM to `nvm use v19.1.0`

#### Run NPM install to install packages

Now that you have NVM to manage Node versions, and a compatible version of NodeJS, you can
install the necessary packages for the Participant application using `npm`

This should only need to happen when the contents of `package.json` change

1.  Open your command line utility
2.  Change directories to the `participant` folder with `cd participant`
3.  Run `npm install -D` (this will take several minutes)

### 💻 Run the Remix application outside of Docker

We've got Docker, NodeJS and our required packages installed.

Now, we can start the application from the command line, in the `participant` folder.

This will take several minutes the first time you run this command, as necessary Docker images and containers are set up.

Future application starts should take ~30 seconds.

This command copies the example environment file so that the application code can read these variables and connect to
the Docker hosted services.

1.  `cp .env.example .env`

This command does several things - starts the postgres container, migrates the database schema, inserts seed records for clinic sites, builds the CSS stylesheets, starts the
Minio S3 local container, creates an S3 Bucket to store files in, and finally starts the Remix service.

2.  `npm run dev`

You will see the last line of the log output when the server is ready:

> Remix App Server started at http://localhost:3000 (http://10.10.10.240:3000)

You can click on that link directly to open the Participant Portal in your default web browser.

The default port for Remix is 3000, but the application will choose other ports based on availability (3001, 3002, etc) if 3000 is unavailable.

### 📦 Run the Remix application inside docker

The application can be run inside a Docker container, with a bind-mount to the local `/app` code (meaning changes to that code will still update the application within the container)

#### Start the docker compose stack

From the `/participant` directory:

`docker compose up`

### 💻📦 About the local version of the application

Changes to the code in the `participant` folder will cause the app to dynamically restart automatically.

Changes to CSS need to be built, using the `npm run css` command.

#### Form Submissions

Form submissions will be stored in the local Docker postgres database. This should be durable across restarts of the application
stack.

You can connect to this database to view or alter form submissions with a postgres-compatible database client.

With Brew on a Mac, you can:

1.  Install the command line client with `brew install libpq`
2.  Connect to the database with `psql -h127.0.0.1 -Upostgres`
3.  This will prompt you for a password; our default is `incredible_local_secret_phrase`

You can use the Postgres command `\d<enter>` to show the database schema, and `\q<enter>` to exit.

A popular postgres graphical client is [PgAdmin](https://www.pgadmin.org/); this should work as well.

#### Document submissions

Document submissions will be stored in the Minio container.

You can use command line S3 clients, but Minio also provides a web interface you can use to view
the files stored in the container. This web interface is hosted at [http://localhost:9001/login](http://localhost:9001/login)

The credentials for this are:

**Username** : `e2e_minio`

**Password** : `incredible_local_secret_phrase`
