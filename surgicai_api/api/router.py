from flask import Blueprint
from flask_restful import Api
from marshmallow import ValidationError

from .opnote import OpNoteListResource, OpNoteResource


class RestfulApi(Api):
    def handle_error(self, e):
        if isinstance(e, ValidationError):
            return {"errors": e.messages}, 400
        return super().handle_error(e)


api_bp = Blueprint("api", __name__)
api = RestfulApi(api_bp)

api.add_resource(OpNoteListResource, "/opnote/", strict_slashes=True)
api.add_resource(OpNoteResource, "/opnote/<string:note_id>/", strict_slashes=True)
