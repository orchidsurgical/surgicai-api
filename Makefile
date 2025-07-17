POETRY=~/.local/bin/poetry

.PHONY:
	init
	format
	check-format
	test
	run

init:		## Setup the project locally.
	$(POETRY) install

format:		## Run python-black to fix any formatting errors.
	$(POETRY) run black .
	$(POETRY) run isort surgicai_api

check-format:	## Run python-black to check for formatting errors.
	$(POETRY) run black --check .
	$(POETRY) run isort --check-only surgicai_api

test:		## Run the pytest unittest suite.
	$(POETRY) run pytest .

run-dev:	## Run the python flask development server.
	$(POETRY) run python3 -m flask --app=surgicai_api.app run --host=0.0.0.0 --port=3001

run-prod:	## Run the production server using gunicorn.
	$(POETRY) run gunicorn --bind=0.0.0.0:3001 surgicai_api.app:app

make-migration:	## Create a new database migration and copy it locally.
	-docker rm -f temp_migration_container 2>/dev/null || true
	rev_id=$$(($(shell ls ./alembic/versions/*.py | wc -l)+1)); \
	docker-compose run --name temp_migration_container api poetry run alembic revision --autogenerate --rev-id "$$rev_id" -m "$(m)"; \
	container_id=$$(docker ps -a -q -f name=temp_migration_container); \
	if [ -n "$$container_id" ]; then \
		docker cp $$container_id:/alembic/versions/. ./alembic/versions/; \
		docker rm $$container_id; \
	fi
	make format

apply-migrations: ## Apply all database migrations.
	docker-compose run api poetry run alembic upgrade head

down-migration: ## Rollback the last database migration.
	docker-compose run api poetry run alembic downgrade -1

help:		## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'
