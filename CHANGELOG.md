# Changelog

<!-- <START NEW CHANGELOG ENTRY> -->

## 1.1.5

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.1.4...f2d5b63946031a2fcc2dc3c143bb4c6e82c23d24))

### Bugs fixed

- Ignore check-wheel-contents W002 duplciate files error during release process as it is done in main [#488](https://github.com/jupyter-server/jupyter-scheduler/pull/488) ([@andrii-i](https://github.com/andrii-i))
- \[1.1.x\] Make server extension verification call during extension startup non-blocking (#480) [#486](https://github.com/jupyter-server/jupyter-scheduler/pull/486) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-11-12&to=2024-02-16&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-11-12..2024-02-16&type=Issues) | [@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2022-11-12..2024-02-16&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2022-11-12..2024-02-16&type=Issues) | [@ellisonbg](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aellisonbg+updated%3A2022-11-12..2024-02-16&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-11-12..2024-02-16&type=Issues) | [@JasonWeill](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3AJasonWeill+updated%3A2022-11-12..2024-02-16&type=Issues) | [@rubenvarela](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Arubenvarela+updated%3A2022-11-12..2024-02-16&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Awelcome+updated%3A2022-11-12..2024-02-16&type=Issues) | [@Zsailer](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3AZsailer+updated%3A2022-11-12..2024-02-16&type=Issues)

<!-- <END NEW CHANGELOG ENTRY> -->

## 1.1.4

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.1.3...2dc60d66a901b9d8ee0d4204803f1e2cf4d4ebf7))

### Enhancements made

- Added exception handling to both api handlers and UI [#302](https://github.com/jupyter-server/jupyter-scheduler/pull/302) ([@3coins](https://github.com/3coins))

### Bugs fixed

- Added exception handling to both api handlers and UI [#302](https://github.com/jupyter-server/jupyter-scheduler/pull/302) ([@3coins](https://github.com/3coins))
- Adds success message on "run job from definition" [#301](https://github.com/jupyter-server/jupyter-scheduler/pull/301) ([@jweill-aws](https://github.com/jweill-aws))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-11-11&to=2022-11-12&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-11-11..2022-11-12&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-11-11..2022-11-12&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-11-11..2022-11-12&type=Issues)

## 1.1.3

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.1.2...5fb7d1f99f65335b3067d2c28278951167d78b4e))

### Enhancements made

- Display success message on list view after creating a job [#297](https://github.com/jupyter-server/jupyter-scheduler/pull/297) ([@jweill-aws](https://github.com/jweill-aws))

### Bugs fixed

- Fixed propagation of error message to UI [#299](https://github.com/jupyter-server/jupyter-scheduler/pull/299) ([@3coins](https://github.com/3coins))
- correctly handle last page even when latest next_token is truthy [#292](https://github.com/jupyter-server/jupyter-scheduler/pull/292) ([@dlqqq](https://github.com/dlqqq))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-11-09&to=2022-11-11&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-11-09..2022-11-11&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2022-11-09..2022-11-11&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-11-09..2022-11-11&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-11-09..2022-11-11&type=Issues)

## 1.1.2

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.1.1...09a48b611a1e2f7255a14de5f3a2be7598c2720f))

### Enhancements made

- Adds error wrapper for list queries [#288](https://github.com/jupyter-server/jupyter-scheduler/pull/288) ([@jweill-aws](https://github.com/jweill-aws))
- Errors for pause, resume, delete in detail page and list view [#286](https://github.com/jupyter-server/jupyter-scheduler/pull/286) ([@jweill-aws](https://github.com/jweill-aws))
- Error alerts in list job definitions view [#284](https://github.com/jupyter-server/jupyter-scheduler/pull/284) ([@jweill-aws](https://github.com/jweill-aws))

### Bugs fixed

- suppress warning raised by jupyter-core [#294](https://github.com/jupyter-server/jupyter-scheduler/pull/294) ([@dlqqq](https://github.com/dlqqq))
- Adds tooltips to job definition links from list view [#287](https://github.com/jupyter-server/jupyter-scheduler/pull/287) ([@jweill-aws](https://github.com/jweill-aws))
- Uses same schema for create job/JD error [#283](https://github.com/jupyter-server/jupyter-scheduler/pull/283) ([@jweill-aws](https://github.com/jweill-aws))

### Other merged PRs

- Guards against "6–5 of 5" [#290](https://github.com/jupyter-server/jupyter-scheduler/pull/290) ([@jweill-aws](https://github.com/jweill-aws))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-11-04&to=2022-11-09&type=c))

[@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2022-11-04..2022-11-09&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-11-04..2022-11-09&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-11-04..2022-11-09&type=Issues)

## 1.1.1

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.1.0...f030c57010cd625a401de21fd875b739880e5fb8))

### Enhancements made

- Bump jupyter-server version ceiling [#278](https://github.com/jupyter-server/jupyter-scheduler/pull/278) ([@dlqqq](https://github.com/dlqqq))
- Adds error reporting [#277](https://github.com/jupyter-server/jupyter-scheduler/pull/277) ([@jweill-aws](https://github.com/jweill-aws))
- Allows spaces in job names, except in the first position [#273](https://github.com/jupyter-server/jupyter-scheduler/pull/273) ([@jweill-aws](https://github.com/jweill-aws))

### Bugs fixed

- hide timezone selector when editing job definition created with utc_only environment [#280](https://github.com/jupyter-server/jupyter-scheduler/pull/280) ([@dlqqq](https://github.com/dlqqq))
- Adds error reporting [#277](https://github.com/jupyter-server/jupyter-scheduler/pull/277) ([@jweill-aws](https://github.com/jweill-aws))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-11-03&to=2022-11-04&type=c))

[@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2022-11-03..2022-11-04&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-11-03..2022-11-04&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-11-03..2022-11-04&type=Issues)

## 1.1.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.0.0...513fce30f9983d108f16d8ebd4577e81b3ecf407))

### Enhancements made

- Enabled outputs for failed jobs [#270](https://github.com/jupyter-server/jupyter-scheduler/pull/270) ([@3coins](https://github.com/3coins))
- move input job file link [#266](https://github.com/jupyter-server/jupyter-scheduler/pull/266) ([@dlqqq](https://github.com/dlqqq))
- Adds UTC-only option to environment model [#265](https://github.com/jupyter-server/jupyter-scheduler/pull/265) ([@jweill-aws](https://github.com/jweill-aws))
- refactor schedule inputs [#264](https://github.com/jupyter-server/jupyter-scheduler/pull/264) ([@dlqqq](https://github.com/dlqqq))

### Bugs fixed

- refactor schedule inputs [#264](https://github.com/jupyter-server/jupyter-scheduler/pull/264) ([@dlqqq](https://github.com/dlqqq))
- Catching create job failures, updates to job definition [#253](https://github.com/jupyter-server/jupyter-scheduler/pull/253) ([@3coins](https://github.com/3coins))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-11-02&to=2022-11-03&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-11-02..2022-11-03&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2022-11-02..2022-11-03&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-11-02..2022-11-03&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-11-02..2022-11-03&type=Issues)

## 1.0.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v0.6.1...77570d8fe60e7237163886cbd3951fa662acac3c))

### Enhancements made

- Validates job name [#259](https://github.com/jupyter-server/jupyter-scheduler/pull/259) ([@jweill-aws](https://github.com/jweill-aws))
- Making name as required in models [#258](https://github.com/jupyter-server/jupyter-scheduler/pull/258) ([@3coins](https://github.com/3coins))
- render better empty list messages [#249](https://github.com/jupyter-server/jupyter-scheduler/pull/249) ([@dlqqq](https://github.com/dlqqq))
- Increase download delay from 500 ms to 5 s [#248](https://github.com/jupyter-server/jupyter-scheduler/pull/248) ([@jweill-aws](https://github.com/jweill-aws))
- allow arbitrary expressions as job parameters [#247](https://github.com/jupyter-server/jupyter-scheduler/pull/247) ([@dlqqq](https://github.com/dlqqq))
- Confirmation for stop with visual feedback on request for Job List, Job Detail [#245](https://github.com/jupyter-server/jupyter-scheduler/pull/245) ([@andrii-i](https://github.com/andrii-i))
- make job definitions editable [#238](https://github.com/jupyter-server/jupyter-scheduler/pull/238) ([@dlqqq](https://github.com/dlqqq))
- API and handler for creating job from definition [#228](https://github.com/jupyter-server/jupyter-scheduler/pull/228) ([@3coins](https://github.com/3coins))
- Create job from job definition - UI [#227](https://github.com/jupyter-server/jupyter-scheduler/pull/227) ([@jweill-aws](https://github.com/jweill-aws))
- Add maxWidth, use LabeledValue in Detail View (#2) [#221](https://github.com/jupyter-server/jupyter-scheduler/pull/221) ([@andrii-i](https://github.com/andrii-i))
- Generic api errors, delete staging files on job delete [#219](https://github.com/jupyter-server/jupyter-scheduler/pull/219) ([@3coins](https://github.com/3coins))

### Bugs fixed

- fix schedule validation errors not clearing after selecting run now [#261](https://github.com/jupyter-server/jupyter-scheduler/pull/261) ([@dlqqq](https://github.com/dlqqq))
- Hides Output Format picker when no output formats are present [#246](https://github.com/jupyter-server/jupyter-scheduler/pull/246) ([@jweill-aws](https://github.com/jweill-aws))
- Added a validate method to check for notebook metadata [#243](https://github.com/jupyter-server/jupyter-scheduler/pull/243) ([@3coins](https://github.com/3coins))
- Chooses the first environment in the create form [#241](https://github.com/jupyter-server/jupyter-scheduler/pull/241) ([@jweill-aws](https://github.com/jweill-aws))
- fix pagination in AdvancedTable [#239](https://github.com/jupyter-server/jupyter-scheduler/pull/239) ([@dlqqq](https://github.com/dlqqq))
- Add additional styling of backgound and paper to handle dark mode. [#230](https://github.com/jupyter-server/jupyter-scheduler/pull/230) ([@ellisonbg](https://github.com/ellisonbg))
- Use LabeledValue in advanced options in Job Definition and Job Definition Detail [#226](https://github.com/jupyter-server/jupyter-scheduler/pull/226) ([@andrii-i](https://github.com/andrii-i))
- Blocks job or job definition creation when a parameter has no key and no value [#218](https://github.com/jupyter-server/jupyter-scheduler/pull/218) ([@jweill-aws](https://github.com/jweill-aws))
- Creates directory based on job name, not based on timestamp [#206](https://github.com/jupyter-server/jupyter-scheduler/pull/206) ([@jweill-aws](https://github.com/jweill-aws))

### Maintenance and upkeep improvements

- Fix for failing check-release workflow [#250](https://github.com/jupyter-server/jupyter-scheduler/pull/250) ([@3coins](https://github.com/3coins))
- Added release workflows [#244](https://github.com/jupyter-server/jupyter-scheduler/pull/244) ([@3coins](https://github.com/3coins))

### Other merged PRs

- Collapse additional options on submit [#217](https://github.com/jupyter-server/jupyter-scheduler/pull/217) ([@jweill-aws](https://github.com/jweill-aws))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-10-27&to=2022-11-02&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-10-27..2022-11-02&type=Issues) | [@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2022-10-27..2022-11-02&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2022-10-27..2022-11-02&type=Issues) | [@ellisonbg](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aellisonbg+updated%3A2022-10-27..2022-11-02&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-10-27..2022-11-02&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-10-27..2022-11-02&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2022-10-27..2022-11-02&type=Issues)

## 0.4.2

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v0.4.1...335027a125e34c394a4e9be4adcbba94677caafe))

### Bugs fixed

- Fixes error when job definition is deleted. [#137](https://github.com/jupyter-server/jupyter-scheduler/pull/137) ([@3coins](https://github.com/3coins))

### Other merged PRs

- Populates runtimeEnvironmentParameters on rerun from list, detail [#149](https://github.com/jupyter-server/jupyter-scheduler/pull/149) ([@jweill-aws](https://github.com/jweill-aws))
- Job descriptions list actions: pause/resume/delete [#141](https://github.com/jupyter-server/jupyter-scheduler/pull/141) ([@jweill-aws](https://github.com/jweill-aws))
- Display model.active as 'Status' : 'Active'/'Paused' [#140](https://github.com/jupyter-server/jupyter-scheduler/pull/140) ([@andrii-i](https://github.com/andrii-i))
- Adds friendly schedule, "paused" columns for job description in list [#138](https://github.com/jupyter-server/jupyter-scheduler/pull/138) ([@jweill-aws](https://github.com/jweill-aws))
- Add Card with placeholder text for Jobs List to Job Definition Details [#136](https://github.com/jupyter-server/jupyter-scheduler/pull/136) ([@andrii-i](https://github.com/andrii-i))
- Sets schedule based on new schedule interval [#132](https://github.com/jupyter-server/jupyter-scheduler/pull/132) ([@jweill-aws](https://github.com/jweill-aws))
- Made update apis consistent with REST APIs [#131](https://github.com/jupyter-server/jupyter-scheduler/pull/131) ([@3coins](https://github.com/3coins))
- Show create job errors in banner above job detail [#124](https://github.com/jupyter-server/jupyter-scheduler/pull/124) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-10-12&to=2022-10-13&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-10-12..2022-10-13&type=Issues) | [@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2022-10-12..2022-10-13&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-10-12..2022-10-13&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-10-12..2022-10-13&type=Issues)

## 0.4.1

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v0.4.0...0d13061a96a4a9865ac8b535573e7f2eba6f0d0d))

### Merged PRs

- Fix outputFormats in model conversion [#127](https://github.com/jupyter-server/jupyter-scheduler/pull/127) ([@jweill-aws](https://github.com/jweill-aws))
- expose runtimeEnvironmentParameters [#126](https://github.com/jupyter-server/jupyter-scheduler/pull/126) ([@andrii-i](https://github.com/andrii-i))
- Makes input file field readonly; removes validation on it [#123](https://github.com/jupyter-server/jupyter-scheduler/pull/123) ([@jweill-aws](https://github.com/jweill-aws))
- Fix FormHelper changing the measurements of the parent element in Job Definition Detail, Create Job [#117](https://github.com/jupyter-server/jupyter-scheduler/pull/117) ([@andrii-i](https://github.com/andrii-i))
- Adds cron tip link [#116](https://github.com/jupyter-server/jupyter-scheduler/pull/116) ([@jweill-aws](https://github.com/jweill-aws))
- Sets default time zone in create-job form [#115](https://github.com/jupyter-server/jupyter-scheduler/pull/115) ([@jweill-aws](https://github.com/jweill-aws))
- Easy create: Create job schedule by minute, hour, day, weekday, week, or month [#111](https://github.com/jupyter-server/jupyter-scheduler/pull/111) ([@jweill-aws](https://github.com/jweill-aws))
- Added task runner to create scheduled jobs from job definition [#106](https://github.com/jupyter-server/jupyter-scheduler/pull/106) ([@3coins](https://github.com/3coins))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-10-08&to=2022-10-12&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-10-08..2022-10-12&type=Issues) | [@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2022-10-08..2022-10-12&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-10-08..2022-10-12&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-10-08..2022-10-12&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2022-10-08..2022-10-12&type=Issues)

## 0.3.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v0.2.1...4c386efc6145af16c0f901edd6e2510c0a3b7522))

### Enhancements made

- Added create_time, created, queued status. [#50](https://github.com/jupyter-server/jupyter-scheduler/pull/50) ([@3coins](https://github.com/3coins))

### Other merged PRs

- Fix to support async api calls [#52](https://github.com/jupyter-server/jupyter-scheduler/pull/52) ([@3coins](https://github.com/3coins))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-09-27&to=2022-09-28&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-09-27..2022-09-28&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-09-27..2022-09-28&type=Issues)

## 0.2.1

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v0.1.1...3e7a0ed95f4ee3fdc04e732edaf69884a58d0133))

### Enhancements made

- CollapsiblePanel [#12](https://github.com/jupyter-server/jupyter-scheduler/pull/12) ([@andrii-i](https://github.com/andrii-i))
- Job details view [#48](https://github.com/jupyter-server/jupyter-scheduler/pull/48) ([@3coins](https://github.com/3coins))
- use MUI Table in job list view [#47](https://github.com/jupyter-server/jupyter-scheduler/pull/47) ([@dlqqq](https://github.com/dlqqq))
- Adds errors, errorsChanged, validation for input field [#44](https://github.com/jupyter-server/jupyter-scheduler/pull/44) ([@jweill-aws](https://github.com/jweill-aws))
- Updated handlers to support async scheduler apis [#41](https://github.com/jupyter-server/jupyter-scheduler/pull/41) ([@3coins](https://github.com/3coins))
- Added a script to seed fake jobs for development [#39](https://github.com/jupyter-server/jupyter-scheduler/pull/39) ([@3coins](https://github.com/3coins))
- Added compute types [#33](https://github.com/jupyter-server/jupyter-scheduler/pull/33) ([@3coins](https://github.com/3coins))
- Material UI integration [#25](https://github.com/jupyter-server/jupyter-scheduler/pull/25) ([@dlqqq](https://github.com/dlqqq))
- Adds extension point for custom environment UI [#24](https://github.com/jupyter-server/jupyter-scheduler/pull/24) ([@jweill-aws](https://github.com/jweill-aws))
- Create job form inputs component [#11](https://github.com/jupyter-server/jupyter-scheduler/pull/11) ([@jweill-aws](https://github.com/jweill-aws))

### Bugs fixed

- Fix params picker when zero params exist [#43](https://github.com/jupyter-server/jupyter-scheduler/pull/43) ([@jweill-aws](https://github.com/jweill-aws))
- Fix create job form [#32](https://github.com/jupyter-server/jupyter-scheduler/pull/32) ([@jweill-aws](https://github.com/jweill-aws))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-09-15&to=2022-09-27&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-09-15..2022-09-27&type=Issues) | [@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2022-09-15..2022-09-27&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2022-09-15..2022-09-27&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-09-15..2022-09-27&type=Issues) | [@ellisonbg](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aellisonbg+updated%3A2022-09-15..2022-09-27&type=Issues)

## 0.1.1

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/4dab98695d7251ae61bd224c18609efe9b6daf44...40d15d9fc3a4e7ea5d6e594c662a61a1ac4a43f7))

### Merged PRs

- Fix for tbump [#8](https://github.com/jupyter-server/jupyter-scheduler/pull/8) ([@3coins](https://github.com/3coins))
- Fix for CI [#7](https://github.com/jupyter-server/jupyter-scheduler/pull/7) ([@3coins](https://github.com/3coins))
- Added UI extension code, updated name for npm dist [#6](https://github.com/jupyter-server/jupyter-scheduler/pull/6) ([@3coins](https://github.com/3coins))
- Added API tests, updated namespace [#2](https://github.com/jupyter-server/jupyter-scheduler/pull/2) ([@3coins](https://github.com/3coins))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-09-10&to=2022-09-15&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-09-10..2022-09-15&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Awelcome+updated%3A2022-09-10..2022-09-15&type=Issues)
