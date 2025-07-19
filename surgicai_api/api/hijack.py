from flask import current_app, g, make_response, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields
from werkzeug.exceptions import Unauthorized

from surgicai_api.api.fields import StrictUUID
from surgicai_api.api.user import UserSchema
from surgicai_api.models.user import User, UserType
from surgicai_api.services.authentication import decode_jwt_token, generate_jwt_token
from surgicai_api.ssr.views import check_jwt


class HijackSchema(Schema):
    user_id = StrictUUID(required=True)


class HijackResource(Resource):
    @check_jwt(require_admin=True)
    def post(self):
        """
        Provide admin access to a user by hijacking their session.

        Returns a cookie with a new JWT, in which the "sub" user id is the
        target user, and the "hijacker" user id is the admin.
        """
        data = HijackSchema().load(request.json)
        target_user_id = data["user_id"]
        target_user = g.db.query(User).filter_by(id=target_user_id).first()
        hijacker_id = g.user.id

        if target_user_id == hijacker_id:
            raise ValidationError({"user_id": "You are already you."})

        jwt = generate_jwt_token(target_user, hijacker_id=hijacker_id)
        response = make_response(
            UserSchema().dumps(target_user), 200, {"content-type": "application/json"}
        )
        response.set_cookie(
            "jwt",
            jwt,
            httponly=True,
            secure=True,
            samesite="Lax",
        )
        response.set_cookie("is_hijacked", value="true")

        return response

    @check_jwt
    def delete(self):
        """
        Release the hijack.

        Returns a cookie with a new JWT, in which the "sub" user id is the
        hijacker.
        """
        # Get the JWT token and decode it to get hijacker info
        jwttoken = request.cookies.get("jwt")
        if not jwttoken:
            raise Unauthorized("No JWT token found.")

        payload = decode_jwt_token(jwttoken)
        if not payload:
            raise Unauthorized("Invalid JWT token.")

        hijacker_id = payload.get("hijacker_id")

        # ensure the jwt is currently hijacked
        if not hijacker_id:
            raise ValidationError("Session is not hijacked.")

        # ensure the hijacker is an admin
        hijacker = g.db.query(User).filter_by(id=hijacker_id).first()
        if not hijacker or hijacker.user_type != UserType.ADMIN:
            raise Unauthorized("Only admins can use user hijacking.")

        # generate a new jwt for the hijacker
        jwt_token = generate_jwt_token(hijacker)
        response = make_response(
            UserSchema().dumps(hijacker),
            200,
            {"content-type": "application/json"},
        )
        response.set_cookie(
            "jwt", value=jwt_token, httponly=True, secure=True, samesite="Lax"
        )
        response.set_cookie("is_hijacked", value="false", max_age=0)
        return response
