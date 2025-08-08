import re

from flask import g, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields

from surgicai_api.api.fields import DateTimeWithTZ, StrictUUID, validate_uuid
from surgicai_api.api.pagination import paginate_query, search_query
from surgicai_api.models import OpNote, OpNoteStatus, Template
from surgicai_api.services.anonymize import anonymize_text, reidentify_text
from surgicai_api.services.openai.note import write_note
from surgicai_api.ssr.views import check_jwt


class OpNoteSchema(Schema):
    id = StrictUUID(dump_only=True)
    owner_id = StrictUUID(dump_only=True)
    title = fields.Str(required=True)
    status = fields.Enum(OpNoteStatus, by_value=True, dump_only=True)
    patient_id = fields.Str(allow_none=True)
    patient_first_name = fields.Str(allow_none=True)
    patient_last_name = fields.Str(allow_none=True)
    operation_datetime_start = DateTimeWithTZ(allow_none=True)
    operation_datetime_end = DateTimeWithTZ(allow_none=True)
    text = fields.Str(allow_none=True)
    created_at = DateTimeWithTZ(dump_only=True)
    updated_at = DateTimeWithTZ(dump_only=True)
    optimization_metadata = fields.Dict(dump_only=True, dump_default={})
    field_data = fields.Method("extract_field_data", dump_only=True, allow_none=True)
    operative_description = fields.Str(allow_none=True)
    template_id = StrictUUID(required=False, allow_none=True, load_only=True)

    def extract_field_data(self, instance):
        """
        Extracts field data from the operative note text.
        The text should contain fields in the format [field: name]content[/field] or [aifield: name]content[/aifield].
        Returns a dictionary of field names and their content and type.
        Example:
        {
            "field name": {
                "is_ai_field": true/false,
                "content": content
            }
        }
        """
        text = instance.text
        if not text:
            return {}
        result = {}
        # Pattern for [field: name]content[/field]
        field_pattern = re.compile(
            r"\[(field|aifield):\s*([^\]]+)](.*?)\[/\1]", re.DOTALL | re.IGNORECASE
        )
        for match in field_pattern.finditer(text):
            field_type = match.group(1).lower()
            field_name = match.group(2).strip()
            content = match.group(3).strip()
            is_ai_field = field_type == "aifield"
            result[field_name] = {"is_ai_field": is_ai_field, "content": content}
        return result


schema = OpNoteSchema()


class OpNoteListResource(Resource):
    method_decorators = [check_jwt]

    def get(self):
        notes = g.db.query(OpNote).filter_by(owner_id=g.user.id)
        notes = search_query(notes, request.args, ["text"])
        notes = paginate_query(notes, request.args).all()

        if not notes:
            return [], 200

        return schema.dump(notes, many=True), 200

    def post(self):
        try:
            data = schema.load(request.json)
        except ValidationError as err:
            return {"errors": err.messages}, 400

        if (template_id := data.pop("template_id", None)) and data.get("text") is None:
            data["text"] = (
                g.db.query(Template)
                .filter_by(id=template_id, owner_id=g.user.id)
                .first()
                .text
            )

        if description := data.get("operative_description", None):
            # Anonymize the description if it exists
            anon_description, replacement_map = anonymize_text(description)
            # Write the note using OpenAI's API
            note_text = write_note(
                operative_description=anon_description,
                template_text=data.get("text"),
                surgeon_name=g.user.full_name
            )
            # Re-identify the anonymized text
            note_text = reidentify_text(note_text, replacement_map)
            data["text"] = note_text

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
