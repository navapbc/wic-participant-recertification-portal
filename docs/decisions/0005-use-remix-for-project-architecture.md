# Use Remix for project architecture

* Status: accepted
* Deciders: @rocketnova, @aplybeah, @microwavenby
* Date: 2022-11-30

Technical Story: https://wicmtdp.atlassian.net/browse/PRP-42
Tech Spec: https://navasage.atlassian.net/wiki/spaces/MWDP/pages/553123898/Tech+Spec+Project+Architecture+PRP

## Context and Problem Statement

What framework do we want to use to build the Participant Recertification Portal?

## Decision Drivers

* We want to make a compelling case that the Portal is a widget that can plug-and-play into any MIS
* We want to continue building out the case for a WIC API standard by adding endpoints to the Mock MIS (aka Mock API)
* We want to make it easy for other organizations to adopt, extend, and deploy our open source code
* We want to iteratively improve on some of the less successful approaches we used when building the Eligibility Screener built for the WIC MT Demonstration Project

## Considered Options

* Next.js FE & BE + PostgreSQL DB
* Next.js FE → Flask BE + PostgreSQL DB
* Remix FE & BE + PostgreSQL DB

## Decision Outcome

We decided on using Remix as both the frontend and backend because we believe it will relieve a lot of the pain points in Next.js, specifically because it is built for multi-page form wizards, with form handling and auth options built-in.
