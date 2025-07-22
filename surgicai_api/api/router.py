import sqlalchemy
from flask import Blueprint, jsonify
from flask_restful import Api
from marshmallow import ValidationError

from surgicai_api.api.admin.hijack import HijackResource
from surgicai_api.api.admin.user import UserListResource, UserResource
from surgicai_api.api.fields import StrictUUID
from surgicai_api.api.login import LoginResource, LogoutResource
from surgicai_api.api.me import MeResource
from surgicai_api.api.opnote import OpNoteListResource, OpNoteResource
from surgicai_api.api.template import TemplateListResource, TemplateResource
from surgicai_api.api.transcribe import TranscribeCredentialsResource


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

api.add_resource(LoginResource, "/login/", strict_slashes=True)
api.add_resource(LogoutResource, "/logout/", strict_slashes=True)
api.add_resource(MeResource, "/me/", strict_slashes=True)
api.add_resource(OpNoteListResource, "/opnote/", strict_slashes=True)
api.add_resource(OpNoteResource, "/opnote/<string:note_id>/", strict_slashes=True)
api.add_resource(TemplateListResource, "/template/", strict_slashes=True)
api.add_resource(
    TemplateResource, "/template/<string:template_id>/", strict_slashes=True
)
api.add_resource(
    TranscribeCredentialsResource, "/transcribe/credentials/", strict_slashes=True
)

# Admin resources
api.add_resource(UserListResource, "/admin/users/", strict_slashes=True)
api.add_resource(UserResource, "/admin/users/<string:user_id>/", strict_slashes=True)
api.add_resource(HijackResource, "/admin/hijack/", strict_slashes=True)
