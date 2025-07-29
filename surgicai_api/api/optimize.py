from copy import deepcopy

from flask import g, request
from flask_restful import Resource
from marshmallow import Schema, fields

from surgicai_api.api.fields import validate_uuid
from surgicai_api.models.opnote import OpNote
from surgicai_api.services.optimization import (
    get_optimization_questions,
    get_optimization_suggestions,
)
from surgicai_api.ssr.views import check_jwt


class OptimizationMetadataAnswerSchema(Schema):
    """Schema for optimization answer."""

    selected_answers = fields.List(fields.Str(), required=True)


class OptimizeNoteQuestionsResource(Resource):
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

        existing = deepcopy(op_note.optimization_metadata or {})
        existing["questions"] = questions
        op_note.optimization_metadata = existing
        g.db.add(op_note)
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
        op_note.optimization_metadata = existing
        g.db.add(op_note)
        g.db.commit()

        return {"questions": op_note.optimization_metadata.get("questions", [])}, 200


class SuggestedEditConfirmationSchema(Schema):
    """Schema for suggested edit confirmation."""

    accepted_edits = fields.List(fields.Bool(), required=True)


class OptimizeNoteSuggestionsResource(Resource):
    method_decorators = [check_jwt]

    def get(self, op_note_id):
        """
        Get optimization suggestions for a specific operative note.
        """
        op_note_id = validate_uuid(op_note_id)
        op_note = (
            g.db.query(OpNote).filter_by(id=op_note_id, owner_id=g.user.id).first()
        )
        if not op_note:
            return {"message": "Not Found"}, 404

        return {
            "suggested_edits": op_note.optimization_metadata.get("suggested_edits", [])
        }, 200

    def post(self, op_note_id):
        """
        Optimize a specific operative note.
        """
        op_note_id = validate_uuid(op_note_id)
        op_note = (
            g.db.query(OpNote).filter_by(id=op_note_id, owner_id=g.user.id).first()
        )
        if not op_note:
            return {"message": "Not Found"}, 404

        if not op_note.optimization_metadata.get("questions", []):
            return {"message": "No optimization questions available"}, 400

        if not all(
            [
                q.get("selected_answer")
                for q in op_note.optimization_metadata["questions"]
            ]
        ):
            return {"message": "All questions must be answered"}, 400

        # TODO: Here you would implement the logic to optimize the note
        # For now, we just return a placeholder response
        suggestions = get_optimization_suggestions(op_note)

        existing = deepcopy(op_note.optimization_metadata or {})
        existing["suggested_edits"] = suggestions
        op_note.optimization_metadata = existing
        g.db.add(op_note)
        g.db.commit()

        return {
            "suggested_edits": op_note.optimization_metadata.get("suggested_edits", [])
        }, 200

    def put(self, op_note_id):
        """
        Confirm or reject suggested edits for a specific operative note.
        {
            "accepted_edits": [true, false, true]
        }
        """
        op_note_id = validate_uuid(op_note_id)
        op_note = (
            g.db.query(OpNote).filter_by(id=op_note_id, owner_id=g.user.id).first()
        )
        if not op_note:
            return {"message": "Not Found"}, 404

        data = SuggestedEditConfirmationSchema().load(request.json)
        existing = deepcopy(op_note.optimization_metadata or {})
        if "suggested_edits" not in existing:
            return {"message": "No suggested edits available"}, 400

        if len(data.get("accepted_edits", [])) != len(existing["suggested_edits"]):
            return {
                "message": "Accepted edits length does not match suggested edits"
            }, 400

        for index, accepted in enumerate(data.get("accepted_edits", [])):
            existing["suggested_edits"][index]["accepted"] = accepted

        op_note.optimization_metadata = existing
        g.db.add(op_note)
        g.db.commit()

        return {
            "suggested_edits": op_note.optimization_metadata.get("suggested_edits", [])
        }, 200
