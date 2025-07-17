from flask import Blueprint
from flask_restful import Api

from .opnote import OpNoteListResource, OpNoteResource

api_bp = Blueprint("api", __name__)
api = Api(api_bp)

api.add_resource(OpNoteListResource, "/opnote/", strict_slashes=True)
api.add_resource(OpNoteResource, "/opnote/<string:note_id>/", strict_slashes=True)
