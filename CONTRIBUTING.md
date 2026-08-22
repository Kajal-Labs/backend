# Contributing

## Branches

We never work directly on `main` or `develop`.

Use:

- `main` — Production-ready code.
- `develop` — Development branch for the next release.
- `feature/*` — New features.
- `bugfix/*` — Normal bug fixes.
- `hotfix/*` — Urgent production fixes.
- `release/*` — Preparing a production release.

### Feature Branch

Use `feature/<description>` for new features.

Examples:

    feature/login
    feature/payment
    feature/booking

### Bugfix Branch

Use `bugfix/<description>` for normal bugs.

Examples:

    bugfix/login-error
    bugfix/payment-timeout

### Hotfix Branch

Use `hotfix/<description>` only for urgent production issues.

Example:

    hotfix/payment-crash

### Release Branch

Use `release/<version>` when preparing a production release.

Example:

    release/v1.0.0

## Development Workflow

1. Update your local `develop` branch.
2. Create a `feature/*` or `bugfix/*` branch.
3. Make your changes.
4. Run tests locally.
5. Commit your changes.
6. Push your branch.
7. Open a Pull Request into `develop`.
8. Request a code review.
9. Address review feedback.
10. Complete QA validation when required.
11. Merge the Pull Request after approval.

## Pull Requests

Every Pull Request should:

- Focus on one feature or bug.
- Link the related GitHub Issue.
- Explain what changed and why.
- Include tests when required.
- Include screenshots when applicable.
- Pass all required CI checks.
- Receive the required code review before merging.

Do not:

- Push directly to `main` or `develop`.
- Approve your own Pull Request.
- Merge unfinished work.
- Commit secrets or sensitive information.

## Commit Messages

Use:

    type(scope): description

Examples:

    feat(auth): add Google login
    fix(payment): handle payment timeout
    docs(api): update API documentation
    refactor(user): simplify service layer
    test(auth): add JWT tests
    chore(deps): update dependencies
    ci(github): update CI workflow
    perf(api): improve response time

### Commit Types

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `refactor` — Code improvement
- `test` — Tests
- `chore` — Maintenance
- `ci` — CI/CD changes
- `perf` — Performance improvements

## Code Review

Every Pull Request must be reviewed before merging.

Reviewers should check:

- Code correctness
- Code quality
- Project conventions
- Security
- Performance
- Tests

Address review comments before merging.

## QA

Changes that require testing must be validated by the QA team before release.

The general workflow is:

    Feature Branch
          ↓
    Pull Request
          ↓
    Code Review
          ↓
       develop
          ↓
         QA
          ↓
       Release
          ↓
        main

## Definition of Done

A task is complete when:

- [ ] Implementation is completed.
- [ ] Tests pass.
- [ ] Pull Request is approved.
- [ ] CI checks pass.
- [ ] QA is completed when required.
- [ ] Pull Request is merged.
