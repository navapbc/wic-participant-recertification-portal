# WIC Participant Recertification Portal

## Project components

This project consists of the following major components:

1. **Participant portal:** A participant portal written in [Remix](https://remix.run) that enables WIC participants to submit information and documents ahead of their recertification appointment.
2. **Staff portal:** A staff portal written in [Lowdefy](https://lowdefy.com) that allows WIC staff to access the information and documents that participants submitted.
3. **Analytics:** Self-hosted, privacy-forward website analytics using [Matomo](https://matomo.org) to track anonymized user metrics.
4. **Infrastructure:** Infrastructure-as-Code (IaC) for deploying and managing all the components on [AWS](https://aws.amazon.com) using [Terraform](https://www.terraform.io/), as well as Continuous Integration and Continuous Deployment (CI/CD) using [Github Actions](https://docs.github.com/en/actions).

### Demos

- **Participant portal:**
  - You can access a live version of the participant portal at [@TODO]().
  - You can access the [Storybook](https://storybook.js.org) for the participant portal. [Our storybook](https://navapbc.github.io/wic-participant-recertification-portal) provides an interactive list of all of the React components for the participant portal, as well as all of the Remix pages.
- **Staff portal:**
  - You can access a static version of the staff portal at [@TODO]().
  - ℹ️ Note: For privacy and security reasons, this demo *does not* show live data from the participant portal, nor is it require authentication.

## Project status

⚠️ **Important!** This repo is not actively maintained. It represents the final state of the project after the conclusion of our pilot. Please apply package and dependency updates before deploying!

## I want to set this up for my WIC State Agency. How do I do that?

Ready to jump in? Great! Take a look at the [architecture diagram]() for deploying all the components, as well as the [getting started documentation]().

## Project description

In 2022, [Nava PBC was selected](https://www.navapbc.com/news/nava-receives-grant-schmidt-futures) by Schmidt Futures to participate as [an inaugural member of](https://www.schmidtfutures.com/schmidt-futures-announces-expanded-benefits-access-grants-to-improve-u-s-social-safety-benefits-access) their new [Social Safety Net Product Studio](https://www.schmidtfutures.com/our-work/benefits-access), a brand new initiative to bring technologist entrepreneurs together to improve the accessibility of U.S. government social safety net benefits. With technical assistance from [Montana Special Supplemental Nutrition Program for Women, Infants, and Children (WIC)](https://dphhs.mt.gov/ecfsd/WIC/), Nava created an open source participant recertification portal to reduce the burden of the six-month/annual recertification process, a necessary step in renewing WIC benefits, on participants and staff.

### Goals

This effort had the following goals:
-   Reduce time spent on recertification data collection in recertification appointments
-   Reduce administrative barriers of in-person recertification appointments
-   Increase retention in WIC
-   Create a strong foundation for Montana and other WIC state and local agencies to create adaptable, user-driven participant portals

### Research

When designing public services, it's important to conduct research with people who will be directly impacted by the product or service. [Engaging a diverse pool of end users](https://www.navapbc.com/toolkits/engaging-users-iterating-power-mission) throughout the design process can ensure that their needs and perspectives are integrated into decisions. For this project, we accomplished this by establishing a participant advisory council (PAC). 

A PAC is a group of program participants that convenes to engage in user research sessions and advise on program improvements. Our council was made up of 12 WIC participants who attended monthly meetings and participated in research activities to help our team ensure that the tools we built met participants’ needs. Read more about PACs in Nava's [How to Build a Participant Advisory Council Toolkit](https://www.navapbc.com/toolkits/how-to-build-a-participant-advisory-council).

Oour Design team also met regularly with Montana WIC stakeholders and an Advising States Council made up of subject matter experts from three other WIC State Agencies to ensure that the tools we built also met staff needs and would be informed by requirements beyond just Montana's.

### Pilot

To test out our designs, we ran a limited pilot with four Montana WIC local agencies. During this time, WIC participants that were due for recertification at one of our participating pilot local agencies received SMS text message reminders that included a link to our pilot website 7 days  and 1 day in advance of their recertification appointment.

Participants would click the link in the text messages to access the participant portal and fill in information and submit documents ahead of their recertification appointment. Staff would authenticate with the staff portal in order to view the information and documents submitted.
