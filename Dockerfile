FROM ubuntu:22.04 as base

# Environment vars
ENV PATH="${PATH}:/root/.local/bin"

# Install Python
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    add-apt-repository -y ppa:deadsnakes/ppa && \
    apt-get update && \
    apt-get install -y python3.10 python3-distutils python3-apt && \
    apt-get install -y curl

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
RUN poetry config virtualenvs.create true

# Copy over directory
COPY . .

FROM base as prod

# Install prod dependencies
RUN poetry install --no-dev

# Start prod service
CMD [ "poetry", "run", "gunicorn", "--bind=0.0.0.0:8312", "python_flask_template.app:app" ]

FROM prod as dev

# Install dev dependencies
RUN poetry install

# Start dev service
CMD [ "poetry", "run", "python3", "-m" , "flask", "--app=python_flask_template.app", "run", "--host=0.0.0.0", "--port=8312"]

