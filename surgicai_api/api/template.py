from flask import g, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields

from surgicai_api.api.fields import StrictUUID, validate_uuid
from surgicai_api.models.template import Template
from surgicai_api.ssr.views import check_jwt


class TemplateSchema(Schema):
    id = StrictUUID(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    owner_id = StrictUUID(dump_only=True)
    name = fields.Str(required=True)
    title = fields.Str(required=False, allow_none=True)
    text = fields.Str(allow_none=True)


schema = TemplateSchema()


class TemplateListResource(Resource):
    method_decorators = [check_jwt]

    def get(self):
        templates = (
            g.db.query(Template)
            .filter_by(owner_id=g.user.id)
            .order_by(Template.name.asc())
            .all()
        )
        return schema.dump(templates, many=True), 200

    def post(self):
        data = schema.load(request.json)
        if not data.get("text", None):
            with open("surgicai_api/services/default_template.txt", "r") as f:
                data["text"] = f.read()
        template = Template(owner_id=str(g.user.id), **data)
        g.db.add(template)
        g.db.commit()
        return schema.dump(template), 201


class TemplateResource(Resource):
    method_decorators = [check_jwt]

    def get(self, template_id):
        template_id = validate_uuid(template_id)
        template = (
            g.db.query(Template).filter_by(id=template_id, owner_id=g.user.id).first()
        )
        if not template:
            return {"message": "Not Found"}, 404
        return schema.dump(template), 200

    def put(self, template_id):
        template_id = validate_uuid(template_id)
        template = (
            g.db.query(Template).filter_by(id=template_id, owner_id=g.user.id).first()
        )
        if not template:
            return {"message": "Not Found"}, 404
        data = schema.load(request.json, partial=True)
        for key, value in data.items():
            setattr(template, key, value)
        g.db.add(template)
        g.db.commit()
        return schema.dump(template), 200

    def delete(self, template_id):
        template_id = validate_uuid(template_id)
        template = (
            g.db.query(Template).filter_by(id=template_id, owner_id=g.user.id).first()
        )
        if not template:
            return {"message": "Not Found"}, 404
        g.db.delete(template)
        g.db.commit()
        return "", 204
