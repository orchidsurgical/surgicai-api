#!/bin/bash

set -e

: "${ROOT_EMAIL:?ROOT_EMAIL env var required}"
: "${ROOT_PASSWORD:?ROOT_PASSWORD env var required}"

# Create root user in the database using a Python one-liner

docker-compose run api \
  poetry run python -c '
from surgicai_api.models import User, UserType
from surgicai_api.app import SessionLocal
from werkzeug.security import generate_password_hash
import os

session = SessionLocal()
try:
    email = os.environ["ROOT_EMAIL"]
    password = os.environ["ROOT_PASSWORD"]
    if session.query(User).filter_by(email=email).first():
        print("Root user already exists.")
    else:
        user = User(
            email=email,
            password=generate_password_hash(password),
            user_type=UserType.ADMIN,
            first_name="Root",
            last_name="User"
        )
        session.add(user)
        session.commit()
        print("Root user created.")
finally:
    session.close()
'