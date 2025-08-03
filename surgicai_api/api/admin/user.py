from flask import g, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields
from werkzeug.security import generate_password_hash

from surgicai_api.api.fields import StrictUUID, validate_uuid
from surgicai_api.models import User, UserType
from surgicai_api.services.user import create_user
from surgicai_api.ssr.views import check_jwt


class UserSchema(Schema):
    id = StrictUUID(dump_only=True)
    prefix = fields.Str(allow_none=True)
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)
    email = fields.Email(required=True)
    password = fields.Str(load_only=True, required=True)
    user_type = fields.Enum(UserType, by_value=True, load_default=UserType.SURGEON)
    organization_id = StrictUUID(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


schema = UserSchema()


class UserListResource(Resource):
    method_decorators = [check_jwt(require_admin=True)]

    def get(self):
        users = g.db.query(User).all()
        return schema.dump(users, many=True), 200

    def post(self):
        try:
            data = schema.load(request.json)
        except ValidationError as err:
            return {"errors": err.messages}, 400
        user = create_user(g.db, **data)
        g.db.commit()
        return schema.dump(user), 201


class UserResource(Resource):
    method_decorators = [check_jwt(require_admin=True)]

    def get(self, user_id):
        user = g.db.query(User).filter_by(id=validate_uuid(user_id)).first()
        if not user:
            return {"message": "Not Found"}, 404
        return schema.dump(user), 200

    def put(self, user_id):
        user = g.db.query(User).filter_by(id=validate_uuid(user_id)).first()
        if not user:
            return {"message": "Not Found"}, 404
        try:
            data = schema.load(request.json, partial=True)
        except ValidationError as err:
            return {"errors": err.messages}, 400
        if "password" in data:
            user.password = generate_password_hash(data.pop("password"))
        for key, value in data.items():
            setattr(user, key, value)
        g.db.add(user)
        g.db.commit()
        return schema.dump(user), 200

    def delete(self, user_id):
        user = g.db.query(User).filter_by(id=validate_uuid(user_id)).first()
        if not user:
            return {"message": "Not Found"}, 404
        g.db.delete(user)
        g.db.commit()
        return "", 204


class SearchUserResource(Resource):
    method_decorators = [check_jwt(require_admin=True)]

    class SearchSchema(Schema):
        term = fields.Str(required=True)

    def get(self):
        data = self.SearchSchema().load(request.args)
        term = data.get("term")

        users = (
            g.db.query(User)
            .filter(
                User.email.ilike(f"%{term}%")
                | User.first_name.ilike(f"%{term}%")
                | User.last_name.ilike(f"%{term}%")
            )
            .all()
        )
        return schema.dump(users, many=True), 200
