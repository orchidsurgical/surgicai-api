# python-flask-template

This repository contains a boilerplate quick-start for bootstrapping a Python-Flask application. It includes
* the flask app itself,
* dependency management via Poetry,
* basic python dependencies,
* a dockerfile,
* docker-compose integration, including
    * a docker-compose Redis cache,
    * a Postgres database
* a makefile,
* a basic GitHub Actions workflow for quality checks

## Setup

To get a new project off the ground ASAP, follow these steps:

1. Clone the repository.
2. Switch the .git repository origin to your repository details
3. Run `make init` to get basic requirements
4. Rename the `surgicai_api` directory to your application name.
5. In `docker-compose.yml`, replace instances of `surgicai_api` with the name you used in step 4.
6. Develop!
