# NLEx Product Roadmap

## Current Product Direction
NLEx aims to bridge the gap between business analysts and data by providing a seamless, chat-based Natural Language to SQL interface capable of interacting with distributed enterprise databases.

## Current Sprint (Sprint 2 / Assignment 4)
**Focus**: Quality, stability, bug fixes, and responding to MVP v1.0 feedback.
* Fix critical UI bugs (input blocking, options override).
* Expand CI testing and code coverage.
* Introduce quality requirements and automated QRTs.
* Deliver Oracle connector for real-world customer usage.

## Expected Next Sprint (MVP v2)
**Focus**: Advanced context management and complex query handling.
* Implement chat history sidebar and persistent conversations (PBI-013).
* Introduce full Trino-SQL Generation Pipeline Integration (PBI-012).
* Allow multiple database connections via configuration (PBI-016).
* Bilingual (RU/EN) prompt tuning (PBI-014).

## Ongoing Quality and Automation Work
* **Continuous Integration**: The Lychee link checker, `pytest` suite, and linting rules will remain strictly enforced on the `main` and `develop` branches.
* **Quality Gates**: The 30% critical module line coverage minimum and passing QRTs will continue to block any PR that lowers product stability.
* **Security Scans**: Dependency auditing will continue to run to prevent CVEs.
