# Staff Portal

## Overview

The staff portal is a [Lowdefy](https://lowdefy.com) that allows WIC staff to access the information and documents that participants submitted in the participant portal. See the [docs](../docs/staff) for details.

## Customization

The staff portal was built for [Montana WIC](https://dphhs.mt.gov/ecfsd/WIC). To customize it for a different WIC state agency, change:

- [The name of the application](https://github.com/navapbc/wic-participant-recertification-portal/blob/0cb2893e3093d7b2f666367558ca6b4221d78e7e/staff/lowdefy.yaml#L4)
- [The page title in the template](https://github.com/navapbc/wic-participant-recertification-portal/blob/0cb2893e3093d7b2f666367558ca6b4221d78e7e/staff/templates/page_template.yml#L52)
- [The logo and alt text](https://github.com/navapbc/wic-participant-recertification-portal/blob/0cb2893e3093d7b2f666367558ca6b4221d78e7e/staff/templates/page_template.yml#L22)

## Lowdefy Reflections

For the pilot, we wanted to use a low-code tool to:

- Be as efficient with our time as possible
- Identify a tool that might save WIC state agencies time & money

We conducted technical research and chose the most affordable and promising tool: Lowdefy. By using lowdefy, we were able to quickly build a functional staff portal that allowed us to learn a lot. We still feel that building the staff portal as a separate application allows maximum flexibility. However, the single most useful feature would be if we were able to directly integrate with M-SPIRIT.

We don’t recommend using Lowdefy at this time for a production staff portal because:

- It is not mature enough for scale
- The documentation is not fully developed
- It requires too many brittle dependencies