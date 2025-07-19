from flask import current_app as app
from flask import make_response, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields
from sqlalchemy.orm import Session

from surgicai_api.models.user import User
from surgicai_api.services.authentication import (
    authenticate_user_password,
    generate_jwt_token,
)


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


login_schema = LoginSchema()


class LoginResource(Resource):
    def post(self):
        data = login_schema.load(request.get_json(force=True))
        email = data["email"]
        password = data["password"]
        session: Session = app.SessionLocal()
        user = authenticate_user_password(session, email, password)
        if not user:
            return {"message": "Invalid email or password."}, 401
        token = generate_jwt_token(user)
        resp = make_response(
            {
                "user_id": str(user.id),
                "email": user.email,
                "user_type": user.user_type.value,
            }
        )
        resp.set_cookie(
            "jwt",
            token,
            httponly=True,
            secure=True,
            samesite="Lax",
            max_age=app.config.get("JWT_EXP_DELTA_SECONDS", 3600),
        )
        return resp


class LogoutResource(Resource):
    def post(self):
        resp = make_response({"message": "Logged out successfully."})
        resp.set_cookie(
            "jwt", "", expires=0, httponly=True, secure=True, samesite="Lax"
        )
        return resp
