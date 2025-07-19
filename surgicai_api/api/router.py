import sqlalchemy
from flask import Blueprint, jsonify
from flask_restful import Api
from marshmallow import ValidationError

from .hijack import HijackResource
from .login import LoginResource, LogoutResource
from .me import MeResource
from .opnote import OpNoteListResource, OpNoteResource
from .user import UserListResource, UserResource


class RestfulApi(Api):
    def handle_error(self, e):
        if isinstance(e, ValidationError):
            return jsonify({"errors": e.messages}), 400

        if isinstance(e, sqlalchemy.exc.NoResultFound):
            return jsonify({"message": "Object not found."}), 404

        if isinstance(e, sqlalchemy.exc.IntegrityError):
            return jsonify({"message": "Object already exists."}), 400

        return super().handle_error(e)


api_bp = Blueprint("api", __name__)
api = RestfulApi(api_bp)

api.add_resource(OpNoteListResource, "/opnote/", strict_slashes=True)
api.add_resource(OpNoteResource, "/opnote/<string:note_id>/", strict_slashes=True)
api.add_resource(UserListResource, "/admin/users/", strict_slashes=True)
api.add_resource(UserResource, "/admin/users/<string:user_id>/", strict_slashes=True)
api.add_resource(MeResource, "/me/", strict_slashes=True)
api.add_resource(LoginResource, "/login/", strict_slashes=True)
api.add_resource(LogoutResource, "/logout/", strict_slashes=True)
api.add_resource(HijackResource, "/admin/hijack/", strict_slashes=True)
