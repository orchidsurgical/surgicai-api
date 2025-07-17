import datetime

import jwt
from flask import current_app as app
from sqlalchemy.orm import Session
from werkzeug.security import check_password_hash, generate_password_hash

from surgicai_api.models.user import User


def generate_jwt_token(user):
    """
    Generate a JWT token for a user.

    Args:
        user (User): The user object for which to generate the token.
    Returns:
        str: The encoded JWT token.
    """
    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "user_type": user.user_type.value,
        "exp": datetime.datetime.now(tz=datetime.timezone.utc)
        + datetime.timedelta(seconds=app.config["JWT_EXP_DELTA_SECONDS"]),
    }
    return jwt.encode(
        payload, app.config["SECRET_KEY"], algorithm=app.config["JWT_ALGORITHM"]
    )


def decode_jwt_token(token):
    """
    Decode a JWT token to get the user information.

    Args:
        token (str): The JWT token to decode.
    Returns:
        dict: The decoded payload containing user information.
    """
    try:
        return jwt.decode(
            token, app.config["SECRET_KEY"], algorithms=[app.config["JWT_ALGORITHM"]]
        )
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def authenticate_user_password(session: Session, email: str, password: str):
    """
    Authenticate a user by email and password.

    Args:
        session (Session): SQLAlchemy session to query the database.
        email (str): User's email.
        password (str): User's password.
    Returns:
        User: The authenticated user object if credentials are valid, otherwise None.
    """
    user = session.query(User).filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        return user
    return None


def set_user_password(session: Session, user: User, new_password: str):
    """
    Set a new password for the user.

    Args:
        session (Session): SQLAlchemy session to update the user.
        user (User): The user object for which to set the new password.
        new_password (str): The new password to set for the user.
    Returns:
        User: The updated user object with the new password.
    """
    password = generate_password_hash(new_password)
    user.password = password
    session.add(user)
    session.flush()
    return user
