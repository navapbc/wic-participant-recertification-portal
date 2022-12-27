# Keep the Eligibility Screener and the Participant Recertification Portal separate

* Status: proposed
* Deciders: @rocketnova, @microwavenby, ...
* Date: [YYYY-MM-DD when the decision was last updated] <!-- optional -->

Technical Story: https://wicmtdp.atlassian.net/browse/PRP-52

## Context and Problem Statement

Now that the [Eligibility Screener](https://github.com/navapbc/wic-mt-demo-project-eligibility-screener) is being re-written in Remix, the framework that we chose in [ADR-0005](0005-use-remix-for-project-architecture.md) to use for the Participant Recertification Portal,

## Decision Drivers

* Is there an easy way to keep the eligibility screener's dependencies up to date?
* Is there an easy way to port improvements made in PRP to the eligibility screener?
* Will it be easier or harder for WIC agencies to use or adopt these tools if they are combined into the same codebase?

## Considered Options

* Combine the eligibility screener and the recertification portal into the same codebase
* Keep the eligibility screener and the recertification portal as two separate codebases

## Decision Outcome

...

## Pros and Cons of the Options

### Combine the eligibility screener and the recertification portal into the same codebase

* Good, because it will be easy to keep the eligibility screener's dependencies up to date
* Good, because we can more easily create and manage a library of shared React components
* Good, because we have fewer code repos to manage

### Keep the eligibility screener and the recertification portal as two separate codebases

* Good, because it will make deploying and using either tool less complicated for us and for any other state agencies
* Good, because we can make architectural decisions for the PRP without worrying about how it might impact the eligibility screener code
* Good, because they are actually distinct standalone tools with distinct use cases
* Bad, because it means over time the two codebases may diverge in foundational or underlying tooling (e.g. tests, linting, package management)
