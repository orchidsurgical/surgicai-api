FROM ubuntu:22.04 AS base

# Environment vars
ENV PATH="${PATH}:/root/.local/bin"

# Install Python
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    add-apt-repository -y ppa:deadsnakes/ppa && \
    apt-get update && \
    apt-get install -y python3.10 python3-distutils python3-apt make && \
    apt-get install -y curl

# Create python symlink
RUN ln -s /usr/bin/python3 /usr/bin/python

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
RUN poetry config virtualenvs.create true

# Copy over directory
COPY . .

FROM base AS prod

# Install prod dependencies
RUN poetry install --without dev

# Start prod service
CMD [ "make", "run-prod" ]

FROM prod AS dev

# Install dev dependencies
RUN poetry install

# Start dev service
CMD [ "make", "run-dev" ]
