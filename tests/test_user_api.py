import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from werkzeug.security import generate_password_hash

from surgicai_api.app import app
from surgicai_api.models.base import Base
from surgicai_api.models import User, UserType
from surgicai_api.services.authentication import generate_jwt_token


def setup_test_app():
    engine = create_engine("sqlite:///:memory:")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    app.SessionLocal = SessionLocal
    app.config["TESTING"] = True
    return app.test_client(), SessionLocal


def create_admin(session_maker):
    session = session_maker()
    admin = User(
        first_name="Admin",
        last_name="User",
        email="admin@example.com",
        password=generate_password_hash("password"),
        user_type=UserType.ADMIN,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    session.close()
    return admin


def test_user_crud_flow():
    client, SessionLocal = setup_test_app()
    admin = create_admin(SessionLocal)
    token = generate_jwt_token(admin)

    headers = {"Content-Type": "application/json"}
    client.set_cookie("localhost", "jwt", token)

    # Create user
    payload = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "password": "secret",
        "user_type": "surgeon",
    }
    response = client.post("/api/v1/users/", data=json.dumps(payload), headers=headers)
    assert response.status_code == 201
    data = response.get_json()
    user_id = data["id"]

    # Get user
    response = client.get(f"/api/v1/users/{user_id}/")
    assert response.status_code == 200
    assert response.get_json()["email"] == "test@example.com"

    # Update user
    update_payload = {"first_name": "Updated"}
    response = client.put(
        f"/api/v1/users/{user_id}/",
        data=json.dumps(update_payload),
        headers=headers,
    )
    assert response.status_code == 200
    assert response.get_json()["first_name"] == "Updated"

    # Delete user
    response = client.delete(f"/api/v1/users/{user_id}/")
    assert response.status_code == 204
