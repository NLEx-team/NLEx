# Definition of Done

A Product Backlog Item (PBI) is considered **Done** only when it satisfies the following criteria:

## Code Quality
- [ ] Code follows the project's established style guide and architectural patterns.
- [ ] Code is async-first for all I/O operations (FastAPI/SQLAlchemy).
- [ ] Type hints are used for all function signatures and complex variable declarations.
- [ ] No `any` types in TypeScript; interfaces/types are defined for all components.
- [ ] No hardcoded secrets, API keys, or sensitive credentials.

## Testing & Validation
- [ ] Unit tests cover all new business logic and edge cases (FastAPI/React).
- [ ] All tests pass successfully using the Docker `test` profile.
- [ ] All acceptance criteria defined in the PBI have been manually verified.
- [ ] No regressions were introduced into existing functionality.

## Documentation
- [ ] Inline code comments added for non-obvious or complex logic.
- [ ] API documentation (Swagger/OpenAPI) updated if endpoints were added or changed.
- [ ] `CHANGELOG.md` updated at the root with a summary of changes (SemVer compliant).

## Process
- [ ] Code has been reviewed and approved by at least one other team member.
- [ ] All review comments have been addressed and resolved.
- [ ] The feature branch is merged into `develop` using a merge-commit workflow.
