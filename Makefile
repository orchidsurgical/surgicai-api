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

check-format:	## Run python-black to check for formatting errors.
	$(POETRY) run black --check .

test:		## Run the pytest unittest suite.
	$(POETRY) run pytest .

run:		## Run the python flask development server.
	$(POETRY) run python3 -m flask --app=python_flask_template.app run --host=0.0.0.0 --port=8312


help:		## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'
