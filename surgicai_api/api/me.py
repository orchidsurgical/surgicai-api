import pytz
from flask import g, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields

from surgicai_api.api.fields import StrictUUID, validate_uuid
from surgicai_api.models import OpNote, OpNoteStatus
from surgicai_api.services.authentication import set_user_password
from surgicai_api.ssr.views import check_jwt


class MeUserSchema(Schema):
    def validate_timezone(value):
        if value and value not in pytz.all_timezones:
            raise ValidationError("Invalid timezone.")

    id = StrictUUID(dump_only=True)
    first_name = fields.Str(required=False)
    last_name = fields.Str(required=False)
    email = fields.Email(required=False)
    user_type = fields.Str(dump_only=True)
    timezone = fields.Str(
        allow_none=True, validate=validate_timezone, load_default=None
    )
    organization_id = StrictUUID(dump_only=True)
    password = fields.Str(load_only=True, required=False)


schema = MeUserSchema()


class MeResource(Resource):
    method_decorators = [check_jwt]

    def get(self):
        user = g.user
        return schema.dump(user), 200

    def put(self):
        try:
            data = schema.load(request.json)
        except ValidationError as err:
            return {"errors": err.messages}, 400

        user = g.user

        if password := data.pop("password", None):
            set_user_password(g.db, user, password)

        for key, value in data.items():
            setattr(user, key, value)

        g.db.commit()
        return schema.dump(user), 200

    def delete(self):
        """
        Delete the current user's account.

        Returns a success message.
        """
        user = g.user
        g.db.delete(user)
        g.db.commit()
        return {"message": "User account deleted successfully."}, 200
