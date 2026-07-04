# Definition of Done

## Table of Contents
- [Criteria](#criteria)

A Product Backlog Item (PBI) is only considered "Done" when all of the following criteria are met:

## Criteria

1. **Acceptance Criteria**: All specific acceptance criteria listed on the PBI are verified and satisfied.
2. **Code Review**: The implementation PR/MR has been reviewed and approved by at least one other team member.
3. **CI Checks Passing**: 
   * Lychee link check passes.
   * `pytest` backend tests pass.
   * `tsc -b` frontend build verification passes.
4. **Automated Testing**: Relevant automated unit and/or integration tests have been written for the new functionality.
5. **Quality Requirement Tests (QRTs)**: If the feature touches critical logic tied to a QR (Security, Performance, Usability), the relevant automated QRTs continue to pass.
6. **Code Coverage**: Any critical module modified (`services/*`, `routers/*`) maintains at least **30% automated line coverage**.
7. **Architecture Documentation**: If a significant architectural decision was made affecting quality requirements, an Architecture Decision Record (ADR) has been written and reviewed.
8. **Testing Evidence**: Test results and coverage are preserved as evidence in the PR or CI logs.
9. **Changelog**: User-visible changes are recorded in the `CHANGELOG.md` file under the `[Unreleased]` section.
