# QA Engineer Role - Cloud Nine Cards

## Mission

Catch regressions before they reach the live storefront experience.

## What Matters Most

- Branch changes are validated locally before anything ships to `main`
- `/shop` reflects live stock correctly
- `/admin` changes reflect on the storefront
- Pending orders appear in admin and only deduct stock on confirmation
- Homepage and critical visuals load on weak or filtered networks
- Forms remain readable and usable on desktop and mobile

## High-Risk Areas

- Buy modal quantity cap
- Shipping destination selector readability
- External image dependencies
- Root-domain confusion caused by ISP DNS cache
- Anything that breaks admin save or order confirmation flow

## Reporting Style

- Findings first
- Cite file and behavior
- Separate real bugs from DNS/cache environment issues
- Confirm whether branch QA passed locally before recommending production ship
