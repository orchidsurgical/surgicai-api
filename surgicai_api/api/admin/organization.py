from flask import g, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields

from surgicai_api.api.admin.user import UserSchema
from surgicai_api.api.fields import StrictUUID, validate_uuid
from surgicai_api.models import Organization
from surgicai_api.models.user import User
from surgicai_api.ssr.views import check_jwt


class OrganizationSchema(Schema):
    id = StrictUUID(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    users_count = fields.Method("get_user_count", dump_only=True)

    def get_user_count(self, obj):
        """Return the count of users in the organization."""
        return g.db.query(User).filter_by(organization_id=obj.id).count()


schema = OrganizationSchema()


class OrganizationListResource(Resource):
    method_decorators = [check_jwt(require_admin=True)]

    def get(self):
        orgs = g.db.query(Organization).all()
        return schema.dump(orgs, many=True), 200

    def post(self):
        try:
            data = schema.load(request.json)
        except ValidationError as err:
            return {"errors": err.messages}, 400
        org = Organization(**data)
        g.db.add(org)
        g.db.commit()
        return schema.dump(org), 201


class OrganizationResource(Resource):
    method_decorators = [check_jwt(require_admin=True)]

    def get(self, org_id):
        org = g.db.query(Organization).filter_by(id=validate_uuid(org_id)).first()
        if not org:
            return {"message": "Not Found"}, 404
        return schema.dump(org), 200

    def put(self, org_id):
        org = g.db.query(Organization).filter_by(id=validate_uuid(org_id)).first()
        if not org:
            return {"message": "Not Found"}, 404
        try:
            data = schema.load(request.json, partial=True)
        except ValidationError as err:
            return {"errors": err.messages}, 400
        for key, value in data.items():
            setattr(org, key, value)
        g.db.add(org)
        g.db.commit()
        return schema.dump(org), 200

    def delete(self, org_id):
        org = g.db.query(Organization).filter_by(id=validate_uuid(org_id)).first()
        if not org:
            return {"message": "Not Found"}, 404
        g.db.delete(org)
        g.db.commit()
        return "", 204


class OrganizationUserResource(Resource):
    method_decorators = [check_jwt(require_admin=True)]

    class AddUserSchema(Schema):
        add = fields.List(StrictUUID(), required=True)

    class RemoveUserSchema(Schema):
        remove = fields.List(StrictUUID(), required=True)

    def get(self, org_id):
        org = g.db.query(Organization).filter_by(id=validate_uuid(org_id)).first()
        if not org:
            return {"message": "Not Found"}, 404
        users = g.db.query(User).filter_by(organization_id=org.id).all()
        return UserSchema().dump(users, many=True), 200

    def post(self, org_id):
        org = g.db.query(Organization).filter_by(id=validate_uuid(org_id)).first()
        if not org:
            return {"message": "Not Found"}, 404

        data = self.AddUserSchema().load(request.json)["add"]
        users = g.db.query(User).filter(User.id.in_(data)).all()
        if not users:
            return {"message": "No valid users found"}, 404

        for user in users:
            user.organization_id = org.id
        g.db.add_all(users)
        g.db.commit()

        return {"message": "User added to organization"}, 201

    def delete(self, org_id):
        org = g.db.query(Organization).filter_by(id=validate_uuid(org_id)).first()
        if not org:
            return {"message": "Not Found"}, 404

        data = self.RemoveUserSchema().load(request.json)["remove"]
        users = (
            g.db.query(User)
            .filter(User.id.in_(data), User.organization_id == org.id)
            .all()
        )
        if not users:
            return {"message": "No valid users found in this organization"}, 404

        for user in users:
            user.organization_id = None
        g.db.add_all(users)
        g.db.commit()

        return {"message": "User removed from organization"}, 204


class SearchOrganizationsResource(Resource):
    method_decorators = [check_jwt(require_admin=True)]

    class SearchSchema(Schema):
        term = fields.Str(required=True)

    def get(self):
        term = self.SearchSchema().load(request.args)["term"]

        orgs = (
            g.db.query(Organization).filter(Organization.name.ilike(f"%{term}%")).all()
        )
        return schema.dump(orgs, many=True), 200
