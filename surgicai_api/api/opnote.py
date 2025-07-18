from datetime import datetime

from flask import g, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields

from surgicai_api.api.fields import DateTimeWithTZ, StrictUUID, validate_uuid
from surgicai_api.models import OpNote, OpNoteStatus
from surgicai_api.ssr.views import check_jwt


class OpNoteSchema(Schema):
    id = StrictUUID(dump_only=True)
    owner_id = StrictUUID(dump_only=True)
    title = fields.Str(required=True)
    status = fields.Enum(
        OpNoteStatus, by_value=True, required=False, default=OpNoteStatus.DRAFT
    )
    patient_id = fields.Str(allow_none=True)
    patient_first_name = fields.Str(allow_none=True)
    patient_last_name = fields.Str(allow_none=True)
    operation_datetime_start = DateTimeWithTZ(allow_none=True)
    operation_datetime_end = DateTimeWithTZ(allow_none=True)
    text = fields.Str(allow_none=True)
    created_at = DateTimeWithTZ(dump_only=True)
    updated_at = DateTimeWithTZ(dump_only=True)


schema = OpNoteSchema()


class OpNoteListResource(Resource):
    method_decorators = [check_jwt]

    def get(self):
        notes = g.db.query(OpNote).filter_by(owner_id=g.user.id).all()
        return schema.dump(notes, many=True), 200

    def post(self):
        try:
            data = schema.load(request.json)
        except ValidationError as err:
            return {"errors": err.messages}, 400
        note = OpNote(owner_id=str(g.user.id), **data)
        g.db.add(note)
        g.db.commit()
        return schema.dump(note), 201


class OpNoteResource(Resource):
    method_decorators = [check_jwt]

    def get(self, note_id):
        note = (
            g.db.query(OpNote)
            .filter_by(id=validate_uuid(note_id), owner_id=g.user.id)
            .first()
        )
        if not note:
            return {"message": "Not Found"}, 404
        return schema.dump(note), 200

    def put(self, note_id):
        note = (
            g.db.query(OpNote)
            .filter_by(id=validate_uuid(note_id), owner_id=g.user.id)
            .first()
        )
        if not note:
            return {"message": "Not Found"}, 404
        try:
            data = schema.load(request.json, partial=True)
        except ValidationError as err:
            return {"errors": err.messages}, 400
        for key, value in data.items():
            setattr(note, key, value)
        g.db.add(note)
        g.db.commit()
        return schema.dump(note), 200

    def delete(self, note_id):
        note = (
            g.db.query(OpNote)
            .filter_by(id=validate_uuid(note_id), owner_id=g.user.id)
            .first()
        )
        if not note:
            return {"message": "Not Found"}, 404
        g.db.delete(note)
        g.db.commit()
        return "", 204
