# surgicAI

This is the surgical.AI application code. It combines a restful api, and server-side rendered templates to provide the UI.

## Layout
- `alembic/` - directory for housing database migration and management scripts
- `scripts/` - shell scripts for local development
- `surgicai_api/` - houses the main application code
    - `api/` - the main restful API for the application
    - `emails/` - a flask extension for sending emails
    - `models/` - sqlalchemy model definitions
    - `services/` - the service layer for the backend (business logic lives here)
    - `ssr/` - server side rendering (frontend)
- `tests/` - pytest-enabled unittests

## Dependency Management

Dependencies are managed through Poetry.

`poetry add <package[@version]>` to add a package.
`poetry remove <package>` to remove a package.
`poetry install` to install all packages.
`poetry run <cmd>` to run a command in the python environment.

## PR Requirements and Code Standards

PRs are required to pass several checks prior to merging.
1. Code must be formatted properly (using python black). `make format`
2. Code imports must be sorted properly (using python isort). `make format`
3. Tests must pass. `make test`
