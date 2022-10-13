# Changelog

<!-- <START NEW CHANGELOG ENTRY> -->

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
- Show create job errors in banner above job detail  [#124](https://github.com/jupyter-server/jupyter-scheduler/pull/124) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-10-12&to=2022-10-13&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-10-12..2022-10-13&type=Issues) | [@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2022-10-12..2022-10-13&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-10-12..2022-10-13&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-10-12..2022-10-13&type=Issues)

<!-- <END NEW CHANGELOG ENTRY> -->

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
