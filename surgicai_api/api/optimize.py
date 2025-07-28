from copy import deepcopy

from flask import g, request
from flask_restful import Resource
from marshmallow import Schema, fields

from surgicai_api.api.fields import validate_uuid
from surgicai_api.models.opnote import OpNote
from surgicai_api.services.optimization import get_optimization_questions
from surgicai_api.ssr.views import check_jwt


class OptimizationMetadataAnswerSchema(Schema):
    """Schema for optimization answer."""

    selected_answers = fields.List(fields.Str(), required=True)


class OptimizeNoteResource(Resource):
    method_decorators = [check_jwt]

    def get(self, op_note_id):
        """
        Get optimization questions for a specific operative note.
        """
        op_note_id = validate_uuid(op_note_id)
        op_note = (
            g.db.query(OpNote).filter_by(id=op_note_id, owner_id=g.user.id).first()
        )
        if not op_note:
            return {"message": "Not Found"}, 404

        return {"questions": op_note.optimization_metadata.get("questions", [])}, 200

    def post(self, op_note_id):
        """
        Get optimization questions for a specific operative note.
        """
        op_note_id = validate_uuid(op_note_id)
        op_note = (
            g.db.query(OpNote).filter_by(id=op_note_id, owner_id=g.user.id).first()
        )

        questions = get_optimization_questions(op_note)

        if not questions:
            return {"message": "No optimization questions available"}, 404

        op_note.optimization_metadata = {"questions": questions}
        g.db.commit()

        return {"questions": questions}, 200

    def put(self, op_note_id):
        """
        Update optimization answers for a specific operative note.
        {
            "selected_answers": [
                "Yes",
                "No"
            ]
        }
        """
        op_note_id = validate_uuid(op_note_id)
        op_note = (
            g.db.query(OpNote).filter_by(id=op_note_id, owner_id=g.user.id).first()
        )
        if not op_note:
            return {"message": "Not Found"}, 404

        data = OptimizationMetadataAnswerSchema().load(request.json)
        existing = deepcopy(op_note.optimization_metadata or {})
        for index, _ in enumerate(data.get("selected_answers", [])):
            answer = data.get("selected_answers")[index]
            if index >= len(existing.get("questions", [])):
                return {"message": f"Invalid answer index {index}"}, 400
            if answer not in existing["questions"][index]["potential_answers"]:
                return {"message": f"Invalid answer for question {index}"}, 400
            existing["questions"][index]["selected_answer"] = answer
        existing["selected_answers"] = data.get("selected_answers")
        op_note.optimization_metadata = existing
        g.db.add(op_note)
        g.db.commit()

        return {"questions": op_note.optimization_metadata.get("questions", [])}, 200
