# Architecture and Overview

The Participant portal is controlled by a [Remix](https://remix.run) application written in [Typescript](https://www.typescriptlang.org/).

Form data submitted by participants is stored in a [Postgres](https://www.postgresql.org/) relational database, accessed through the [Prisma ORM library](https://www.prisma.io/). This database is run as a [Docker](docker.com/) container locally, and as a managed [Aurora Serverless V2 database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html) in deployment.

Uploaded documents submitted by participants are stored in a [Minio](https://min.io/) docker container locally, or in [AWS S3](https://docs.aws.amazon.com/s3/index.html) when deployed.

![Participant Diagram](https://github.com/navapbc/wic-participant-recertification-portal/assets/723391/e79ebebb-aebb-4e12-98ca-d0e0bb7d4ee3)

# Components

## Remix (Participant Application)

Remix is a javascript framework based on [React Router](https://reactrouter.com/en/main) and [React](https://react.dev/). It provides semantics for writing code that renders both a page for a browser and the HTTP API endpoints that the page may consume, with ["Loaders"](https://remix.run/docs/en/1.16.1/route/loader) responding to GET requests from the page, and ["Actions"](https://remix.run/docs/en/1.16.1/route/action) responding to POST requests. These semantics mean that one page, such as the [count](../../participant/app/routes/%24localAgency/recertify/count.tsx) route, can have a Loader to provide data needed for the page render, as well as an Action to process data submitted from that page's form.

The route's render occurs mostly with familiar [React](https://react.dev/) component patterns, and additional hooks to provide data from the Loader and Action functions on the server to the page.

Remix cannot be run as a Single-Page Application, and must have a running server to host the page. In the participant application, all data from an individual participant needs to be stored on a server, so we consider this a reasonable limitation for the use case.

## Postgres & Prisma (Database Interactions)

Postgres is an open source relational database that is robust and reliable. We utilize this database to store an individual's submitted form pages in association with a random session identifier that expires after 30 minutes of inactivity.

Our server application uses the Prisma library to access the Postgres database. This use of an ORM makes it likely that if another database solution better suits your needs, you may be able to swap Postgres for that solution without rewriting the database interaction code. Our database interactions are siloed in [db.server.ts](../../participant/app/utils/db.server.ts), so that if you needed to change the way data was stored or marshaled it should only require updating these functions. As we rely currently on the JSONB features of Postgres, a replacement would likely need to be able to store serialized object data or more extensive rewrites to db.server.ts.

## S3 Object Storage (Document Uploads)

The AWS S3 pattern for object storage is a broadly accepted standard for storing file objects, and offers many potential alternative hosting options if needed.

The Remix application provides signed PUT URLs for the [upload page](../../participant/app/routes/%24localAgency/recertify/upload.tsx) to stream uploaded files to, and signed GET URLs to render preview thumbnails. This means the participant or developer when interacting with the upload page is streaming files directly to/from either S3 or Minio, rather than being proxied through the Remix application.
