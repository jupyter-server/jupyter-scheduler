# Changelog

<!-- <START NEW CHANGELOG ENTRY> -->

## 2.11.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.10.0...7de27edc63b127675737388d701385a8678d3677))

### Enhancements made

- bump fsspec version excluding 2025.3.1 that was yanked on PyPI [#585](https://github.com/jupyter-server/jupyter-scheduler/pull/585) ([@andrii-i](https://github.com/andrii-i))
- Updated JupyterLab Classifier to JupyterLab 4, Bump actions/cache to v3 [#576](https://github.com/jupyter-server/jupyter-scheduler/pull/576) ([@astitv-sh](https://github.com/astitv-sh))
- Add support for Python 3.13 version and remove support for Python 3.7 and 3.8 versions [#575](https://github.com/jupyter-server/jupyter-scheduler/pull/575) ([@asmita-sharma1625](https://github.com/asmita-sharma1625))
- Enforce path imports for mui icons, Migrate to newer eslint (v8) [#572](https://github.com/jupyter-server/jupyter-scheduler/pull/572) ([@astitv-sh](https://github.com/astitv-sh))

### Bugs fixed

- Remove "RTC" drive prefix from filepath added by jupyter-collaboration when using notebook scheduler widget [#577](https://github.com/jupyter-server/jupyter-scheduler/pull/577) ([@asmita-sharma1625](https://github.com/asmita-sharma1625))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2024-11-13&to=2025-05-16&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2024-11-13..2025-05-16&type=Issues) | [@asmita-sharma1625](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aasmita-sharma1625+updated%3A2024-11-13..2025-05-16&type=Issues) | [@astitv-sh](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aastitv-sh+updated%3A2024-11-13..2025-05-16&type=Issues)

<!-- <END NEW CHANGELOG ENTRY> -->

## 2.10.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.9.0...524854685da5dce8b3030b3fd15e36f237fb021c))

### Maintenance and upkeep improvements

- Relax fsspec and pytz version pins allowing latest versions [#557](https://github.com/jupyter-server/jupyter-scheduler/pull/557) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2024-09-18&to=2024-11-13&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2024-09-18..2024-11-13&type=Issues)

## 2.9.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.8.0...1f431cfa410c98868ff655c2f84986a10b91f4dc))

### Enhancements made

- Add support for Python 3.12, update versions of github actions [#548](https://github.com/jupyter-server/jupyter-scheduler/pull/548) ([@andrii-i](https://github.com/andrii-i))

### Maintenance and upkeep improvements

- Add support for Python 3.12, update versions of github actions [#548](https://github.com/jupyter-server/jupyter-scheduler/pull/548) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2024-08-29&to=2024-09-18&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2024-08-29..2024-09-18&type=Issues)

## 2.8.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.7.1...bfb84b632f375426529fde1226042651025a85a2))

### Enhancements made

- Support jupyter-collaboration by handling RTC prefix in the file paths [#541](https://github.com/jupyter-server/jupyter-scheduler/pull/541) ([@andrii-i](https://github.com/andrii-i))
- Updated integration tests workflow [#535](https://github.com/jupyter-server/jupyter-scheduler/pull/535) ([@krassowski](https://github.com/krassowski))
- Add GitHub bug, issue, PR templates [#534](https://github.com/jupyter-server/jupyter-scheduler/pull/534) ([@andrii-i](https://github.com/andrii-i))
- Add OpenAPI API specification [#527](https://github.com/jupyter-server/jupyter-scheduler/pull/527) ([@andrii-i](https://github.com/andrii-i))

### Documentation improvements

- Updated copyright template [#538](https://github.com/jupyter-server/jupyter-scheduler/pull/538) ([@srdas](https://github.com/srdas))
- Add OpenAPI API specification [#527](https://github.com/jupyter-server/jupyter-scheduler/pull/527) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2024-06-03&to=2024-08-29&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2024-06-03..2024-08-29&type=Issues) | [@krassowski](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Akrassowski+updated%3A2024-06-03..2024-08-29&type=Issues) | [@srdas](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Asrdas+updated%3A2024-06-03..2024-08-29&type=Issues)

## 2.7.1

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.7.0...8b13516cb9a2ad804b8e866e80307b1428ec089a))

### Enhancements made

- Emit telemetry event on "Run job with input folder" checkbox click [#523](https://github.com/jupyter-server/jupyter-scheduler/pull/523) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2024-05-29&to=2024-06-03&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2024-05-29..2024-06-03&type=Issues)

## 2.7.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.6.0...5b55901d565ad1a2894beaf1aa638dbc016bcf37))

### Enhancements made

- Update to SQLAlchemy 2.x [#521](https://github.com/jupyter-server/jupyter-scheduler/pull/521) ([@andrii-i](https://github.com/andrii-i))
- Add database schema update and database migration logic [#520](https://github.com/jupyter-server/jupyter-scheduler/pull/520) ([@andrii-i](https://github.com/andrii-i))
- Use pytest temporary folders and fixtures to create test file hierarchy at test time [#516](https://github.com/jupyter-server/jupyter-scheduler/pull/516) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2024-04-30&to=2024-05-29&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2024-04-30..2024-05-29&type=Issues)

## 2.6.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.5.2...51a5ee4cb5681844ee4d6d2577545fb973ad7890))

### Enhancements made

- Add tests for Scheduler job and job definition creation with input folder, refactor execution manager test [#513](https://github.com/jupyter-server/jupyter-scheduler/pull/513) ([@andrii-i](https://github.com/andrii-i))
- Package input files (no autodownload, no multiprocessing DownloadManager) [#510](https://github.com/jupyter-server/jupyter-scheduler/pull/510) ([@andrii-i](https://github.com/andrii-i))

### Maintenance and upkeep improvements

- Clarify support lifecycle after JupyterLab 3 end of maintenance [#508](https://github.com/jupyter-server/jupyter-scheduler/pull/508) ([@andrii-i](https://github.com/andrii-i))

### Documentation improvements

- Clarify support lifecycle after JupyterLab 3 end of maintenance [#508](https://github.com/jupyter-server/jupyter-scheduler/pull/508) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2024-04-15&to=2024-04-30&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2024-04-15..2024-04-30&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2024-04-15..2024-04-30&type=Issues)

## 2.5.2

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.5.1...b01c76088bb9acfac846727681a94c6e58493b9e))

### Bugs fixed

- Changed column header to "Input file" in Notebook Job Definitions [#496](https://github.com/jupyter-server/jupyter-scheduler/pull/496) ([@srdas](https://github.com/srdas))

### Maintenance and upkeep improvements

- Update Release Scripts [#502](https://github.com/jupyter-server/jupyter-scheduler/pull/502) ([@blink1073](https://github.com/blink1073))
- Bump ip from 2.0.0 to 2.0.1 [#491](https://github.com/jupyter-server/jupyter-scheduler/pull/491) ([@dependabot](https://github.com/dependabot))
- Bump ip from 2.0.0 to 2.0.1 in /ui-tests [#490](https://github.com/jupyter-server/jupyter-scheduler/pull/490) ([@dependabot](https://github.com/dependabot))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2024-02-15&to=2024-04-15&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2024-02-15..2024-04-15&type=Issues) | [@blink1073](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ablink1073+updated%3A2024-02-15..2024-04-15&type=Issues) | [@dependabot](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adependabot+updated%3A2024-02-15..2024-04-15&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2024-02-15..2024-04-15&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2024-02-15..2024-04-15&type=Issues) | [@srdas](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Asrdas+updated%3A2024-02-15..2024-04-15&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Awelcome+updated%3A2024-02-15..2024-04-15&type=Issues)

## 2.5.1

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.5.0...01fc2dca2a01673311abbaf970e0a80ee1368299))

### Bugs fixed

- Fix translator usage, remove @jupyterlab/rendermime-interfaces dependency [#483](https://github.com/jupyter-server/jupyter-scheduler/pull/483) ([@andrii-i](https://github.com/andrii-i))
- Make server extension verification call during extension startup non-blocking [#480](https://github.com/jupyter-server/jupyter-scheduler/pull/480) ([@andrii-i](https://github.com/andrii-i))

### Maintenance and upkeep improvements

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2024-01-23&to=2024-02-15&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2024-01-23..2024-02-15&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2024-01-23..2024-02-15&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2024-01-23..2024-02-15&type=Issues)

## 2.5.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.4.0...675dba6adaa4cec879c9b4c4e85c07020ee88519))

### Enhancements made

- Emit telemetry events on success and failure of the Create Job, Create Job Definition, Create Job from Job Definition hooks [#472](https://github.com/jupyter-server/jupyter-scheduler/pull/472) ([@andrii-i](https://github.com/andrii-i))

### Maintenance and upkeep improvements

- Bump @babel/traverse from 7.19.0 to 7.23.7 [#474](https://github.com/jupyter-server/jupyter-scheduler/pull/474) ([@dependabot](https://github.com/dependabot))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-11-16&to=2024-01-23&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2023-11-16..2024-01-23&type=Issues) | [@dependabot](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adependabot+updated%3A2023-11-16..2024-01-23&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2023-11-16..2024-01-23&type=Issues)

## 2.4.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.3.0...caa3c1c75d6d03498972aec5bad0b67095a22f62))

### Enhancements made

- Pydantic v1 and v2 compatibility, add `pydantic_v1` module [#463](https://github.com/jupyter-server/jupyter-scheduler/pull/463) ([@JasonWeill](https://github.com/JasonWeill))

### Bugs fixed

- Removes zero-height style rule, which broke table display in Safari [#461](https://github.com/jupyter-server/jupyter-scheduler/pull/461) ([@JasonWeill](https://github.com/JasonWeill))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-11-01&to=2023-11-16&type=c))

[@JasonWeill](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3AJasonWeill+updated%3A2023-11-01..2023-11-16&type=Issues)

## 2.3.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.2.0...e4986ce481a4b7626179bd264cd2523c3c32dee7))

### Enhancements made

- Telemetry patch [#457](https://github.com/jupyter-server/jupyter-scheduler/pull/457) ([@3coins](https://github.com/3coins))
- Added telemetry support. [#448](https://github.com/jupyter-server/jupyter-scheduler/pull/448) ([@3coins](https://github.com/3coins))

### Bugs fixed

- Removed onMouseDown handler to avoid double submission [#459](https://github.com/jupyter-server/jupyter-scheduler/pull/459) ([@3coins](https://github.com/3coins))
- Migrate from hub to gh in workflows [#452](https://github.com/jupyter-server/jupyter-scheduler/pull/452) ([@dlqqq](https://github.com/dlqqq))
- Fix "event loop is already running" bug on Linux [#450](https://github.com/jupyter-server/jupyter-scheduler/pull/450) ([@dlqqq](https://github.com/dlqqq))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-10-13&to=2023-11-01&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2023-10-13..2023-11-01&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2023-10-13..2023-11-01&type=Issues) | [@Zsailer](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3AZsailer+updated%3A2023-10-13..2023-11-01&type=Issues)

## 2.2.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.1.0...eab721a0d3f6b226dc4d074d817c8492dedb9ea0))

### Maintenance and upkeep improvements

- Bump systeminformation from 5.18.7 to 5.21.11 in /ui-tests [#442](https://github.com/jupyter-server/jupyter-scheduler/pull/442) ([@dependabot](https://github.com/dependabot))
- Bump postcss from 8.4.26 to 8.4.31 in /ui-tests [#441](https://github.com/jupyter-server/jupyter-scheduler/pull/441) ([@dependabot](https://github.com/dependabot))
- Bump postcss from 8.4.16 to 8.4.31 [#440](https://github.com/jupyter-server/jupyter-scheduler/pull/440) ([@dependabot](https://github.com/dependabot))
- Fix RTD and E2E CI workflows [#438](https://github.com/jupyter-server/jupyter-scheduler/pull/438) ([@andrii-i](https://github.com/andrii-i), [@dlqqq](https://github.com/dlqqq))
- Remove unused s3fs dependency [#437](https://github.com/jupyter-server/jupyter-scheduler/pull/437) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-08-15&to=2023-10-13&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2023-08-15..2023-10-13&type=Issues) | [@dependabot](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adependabot+updated%3A2023-08-15..2023-10-13&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2023-08-15..2023-10-13&type=Issues)

## 2.1.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v2.0.0...a7bce768b5e95e7487ef4f5aac82ac0918d377d0))

### Enhancements made

- Add version specifiers for all dependencies [#422](https://github.com/jupyter-server/jupyter-scheduler/pull/422) ([@dlqqq](https://github.com/dlqqq))
- Archiving all-files scheduler [#388](https://github.com/jupyter-server/jupyter-scheduler/pull/388) ([@JasonWeill](https://github.com/JasonWeill))

### Bugs fixed

- Fix JFM tests [#424](https://github.com/jupyter-server/jupyter-scheduler/pull/424) ([@dlqqq](https://github.com/dlqqq))
- Avoids "filter" option in tarfile [#419](https://github.com/jupyter-server/jupyter-scheduler/pull/419) ([@JasonWeill](https://github.com/JasonWeill))
- Fix CI, run lint, reduce end-to-end tests flakiness [#417](https://github.com/jupyter-server/jupyter-scheduler/pull/417) ([@andrii-i](https://github.com/andrii-i))

### Maintenance and upkeep improvements

- Fix CI, run lint, reduce end-to-end tests flakiness [#417](https://github.com/jupyter-server/jupyter-scheduler/pull/417) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-07-26&to=2023-08-15&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2023-07-26..2023-08-15&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2023-07-26..2023-08-15&type=Issues) | [@JasonWeill](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3AJasonWeill+updated%3A2023-07-26..2023-08-15&type=Issues)

## 2.0.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.3.4...d423ede7a751dae2326f90095ddb4e444346d61a))

### Enhancements made

- allow update E2E snapshots job to be manually triggered [#404](https://github.com/jupyter-server/jupyter-scheduler/pull/404) ([@dlqqq](https://github.com/dlqqq))
- Upgrade to JupyterLab 4 [#402](https://github.com/jupyter-server/jupyter-scheduler/pull/402) ([@dlqqq](https://github.com/dlqqq))
- Add UI tests [#387](https://github.com/jupyter-server/jupyter-scheduler/pull/387) ([@andrii-i](https://github.com/andrii-i))

### Maintenance and upkeep improvements

- Bump word-wrap from 1.2.3 to 1.2.4 [#401](https://github.com/jupyter-server/jupyter-scheduler/pull/401) ([@dependabot](https://github.com/dependabot))
- Bump semver from 5.7.1 to 5.7.2 [#397](https://github.com/jupyter-server/jupyter-scheduler/pull/397) ([@dependabot](https://github.com/dependabot))
- Add UI tests [#387](https://github.com/jupyter-server/jupyter-scheduler/pull/387) ([@andrii-i](https://github.com/andrii-i))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-07-03&to=2023-07-26&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2023-07-03..2023-07-26&type=Issues) | [@dependabot](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adependabot+updated%3A2023-07-03..2023-07-26&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2023-07-03..2023-07-26&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2023-07-03..2023-07-26&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2023-07-03..2023-07-26&type=Issues)

## 1.3.4

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.3.3...aaa3a8922a3021b1158c668e50b17e2bf708b4e6))

### Bugs fixed

- Pins Pydantic to version 1, adds Python 3.11 [#391](https://github.com/jupyter-server/jupyter-scheduler/pull/391) ([@JasonWeill](https://github.com/JasonWeill))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-06-27&to=2023-07-03&type=c))

[@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2023-06-27..2023-07-03&type=Issues) | [@JasonWeill](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3AJasonWeill+updated%3A2023-06-27..2023-07-03&type=Issues)

## 1.3.3

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.3.2...5cd14b538a656e8fd2318dbbb687f2bf4da8fd37))

### Bugs fixed

- Fix 'icon' prop typing for ConfirmButton component [#386](https://github.com/jupyter-server/jupyter-scheduler/pull/386) ([@andrii-i](https://github.com/andrii-i))
- Add click handler to mouseDown on confirm button for Safari compatibilty [#385](https://github.com/jupyter-server/jupyter-scheduler/pull/385) ([@JasonWeill](https://github.com/JasonWeill))

### Maintenance and upkeep improvements

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-05-11&to=2023-06-27&type=c))

[@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2023-05-11..2023-06-27&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2023-05-11..2023-06-27&type=Issues) | [@JasonWeill](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3AJasonWeill+updated%3A2023-05-11..2023-06-27&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2023-05-11..2023-06-27&type=Issues)

## 1.3.2

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.3.1...6e4081a273b6da508942d3fe0b4a8ee75f2eade3))

### Bugs fixed

- Fixed encoding while reading notebook in some platforms [#354](https://github.com/jupyter-server/jupyter-scheduler/pull/354) ([@3coins](https://github.com/3coins))

### Maintenance and upkeep improvements

- Bump webpack from 5.74.0 to 5.76.1 [#360](https://github.com/jupyter-server/jupyter-scheduler/pull/360) ([@dependabot](https://github.com/dependabot))
- Bump json5 from 1.0.1 to 1.0.2 [#359](https://github.com/jupyter-server/jupyter-scheduler/pull/359) ([@dependabot](https://github.com/dependabot))
- Bump loader-utils from 1.4.0 to 1.4.2 [#357](https://github.com/jupyter-server/jupyter-scheduler/pull/357) ([@dependabot](https://github.com/dependabot))
- Bump http-cache-semantics from 4.1.0 to 4.1.1 [#358](https://github.com/jupyter-server/jupyter-scheduler/pull/358) ([@dependabot](https://github.com/dependabot))
- Bump decode-uri-component from 0.2.0 to 0.2.2 [#356](https://github.com/jupyter-server/jupyter-scheduler/pull/356) ([@dependabot](https://github.com/dependabot))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-02-27&to=2023-05-11&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2023-02-27..2023-05-11&type=Issues) | [@dependabot](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adependabot+updated%3A2023-02-27..2023-05-11&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2023-02-27..2023-05-11&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2023-02-27..2023-05-11&type=Issues)

## 1.3.1

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.3.0...e36032d3331200b4f21261bdc50e8d733e66b2bc))

### Bugs fixed

- Fixed issue with extension always deactivating [#347](https://github.com/jupyter-server/jupyter-scheduler/pull/347) ([@3coins](https://github.com/3coins))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2023-02-24&to=2023-02-27&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2023-02-24..2023-02-27&type=Issues)

## 1.3.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.2.0...e7c0c1b12f3a0debb9cd30b1ddc6d6b7ddfd800e))

### Enhancements made

- bump binder node version [#343](https://github.com/jupyter-server/jupyter-scheduler/pull/343) ([@dlqqq](https://github.com/dlqqq))
- Added fallback to active python env when conda is absent [#342](https://github.com/jupyter-server/jupyter-scheduler/pull/342) ([@3coins](https://github.com/3coins))

### Bugs fixed

- Fix check release workflow [#344](https://github.com/jupyter-server/jupyter-scheduler/pull/344) ([@dlqqq](https://github.com/dlqqq))
- Adds server extension check on startup [#341](https://github.com/jupyter-server/jupyter-scheduler/pull/341) ([@JasonWeill](https://github.com/JasonWeill))
- explicitly state pytest-cov test dep [#336](https://github.com/jupyter-server/jupyter-scheduler/pull/336) ([@dlqqq](https://github.com/dlqqq))
- fix(event-note-icon): add viewBox attr to svg so it resizes [#333](https://github.com/jupyter-server/jupyter-scheduler/pull/333) ([@maxime-helen](https://github.com/maxime-helen))

### Maintenance and upkeep improvements

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-12-20&to=2023-02-24&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-12-20..2023-02-24&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2022-12-20..2023-02-24&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-12-20..2023-02-24&type=Issues) | [@JasonWeill](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3AJasonWeill+updated%3A2022-12-20..2023-02-24&type=Issues) | [@maxime-helen](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Amaxime-helen+updated%3A2022-12-20..2023-02-24&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2022-12-20..2023-02-24&type=Issues) | [@rubenvarela](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Arubenvarela+updated%3A2022-12-20..2023-02-24&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Awelcome+updated%3A2022-12-20..2023-02-24&type=Issues)

## 1.2.0

([Full Changelog](https://github.com/jupyter-server/jupyter-scheduler/compare/v1.1.4...211c92b26eecc701f4e108fd18ddc38c5dea38ef))

### Enhancements made

- Adds reload on detail page [#315](https://github.com/jupyter-server/jupyter-scheduler/pull/315) ([@jweill-aws](https://github.com/jweill-aws))
- Adds override for job files manager, more error handlers [#314](https://github.com/jupyter-server/jupyter-scheduler/pull/314) ([@jweill-aws](https://github.com/jweill-aws))
- Displays errors on edit job definition page [#308](https://github.com/jupyter-server/jupyter-scheduler/pull/308) ([@jweill-aws](https://github.com/jweill-aws))
- Update file snapshot while editing job definition by dragndrop from file browser [#285](https://github.com/jupyter-server/jupyter-scheduler/pull/285) ([@andrii-i](https://github.com/andrii-i))

### Bugs fixed

- Added exception handlers, simplified imports [#309](https://github.com/jupyter-server/jupyter-scheduler/pull/309) ([@3coins](https://github.com/3coins))
- Updates "Download job files" tooltip in list jobs view [#307](https://github.com/jupyter-server/jupyter-scheduler/pull/307) ([@jweill-aws](https://github.com/jweill-aws))

### Maintenance and upkeep improvements

### Documentation improvements

- Add happy-case/happy path walkthrough to user docs [#323](https://github.com/jupyter-server/jupyter-scheduler/pull/323) ([@andrii-i](https://github.com/andrii-i))
- Add readme links [#312](https://github.com/jupyter-server/jupyter-scheduler/pull/312) ([@dlqqq](https://github.com/dlqqq))
- migrate to readthedocs documentation [#311](https://github.com/jupyter-server/jupyter-scheduler/pull/311) ([@dlqqq](https://github.com/dlqqq))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyter-server/jupyter-scheduler/graphs/contributors?from=2022-11-12&to=2022-12-20&type=c))

[@3coins](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3A3coins+updated%3A2022-11-12..2022-12-20&type=Issues) | [@andrii-i](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Aandrii-i+updated%3A2022-11-12..2022-12-20&type=Issues) | [@dlqqq](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Adlqqq+updated%3A2022-11-12..2022-12-20&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Agithub-actions+updated%3A2022-11-12..2022-12-20&type=Issues) | [@jweill-aws](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Ajweill-aws+updated%3A2022-11-12..2022-12-20&type=Issues) | [@pre-commit-ci](https://github.com/search?q=repo%3Ajupyter-server%2Fjupyter-scheduler+involves%3Apre-commit-ci+updated%3A2022-11-12..2022-12-20&type=Issues)

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
