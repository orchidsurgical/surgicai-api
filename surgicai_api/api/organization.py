import pytz
from flask import g, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields, validate

from surgicai_api.api.fields import StrictUUID, validate_uuid
from surgicai_api.models import Organization, User
from surgicai_api.models.user import UserType
from surgicai_api.services.authentication import set_user_password
from surgicai_api.services.user import create_user
from surgicai_api.ssr.views import check_jwt


class OrganizationSchema(Schema):

    id = StrictUUID(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class OrganizationUsersSchema(Schema):
    id = StrictUUID(dump_only=True)
    prefix = fields.Str(allow_none=True)
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)
    email = fields.Email(required=True)
    user_type = fields.Str(
        required=True,
        validate=validate.OneOf([UserType.SURGEON, UserType.ORGANIZATION]),
    )
    password = fields.Str(load_only=True)
    organization_id = StrictUUID(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    last_login = fields.DateTime(dump_only=True)


class OrganizationManagementResource(Resource):
    @check_jwt
    def get(self, organization_id):
        organization_id = validate_uuid(organization_id, load=True)

        # user must belong to the organization
        if g.user.organization_id != organization_id:
            return {"message": "Not Found"}, 404

        org = g.db.query(Organization).filter_by(id=organization_id).first()
        return OrganizationSchema().dump(org), 200

    @check_jwt
    def put(self, organization_id):
        organization_id = validate_uuid(organization_id, load=True)

        if g.user.organization_id != organization_id:
            return {"message": "Not Found"}, 404

        if g.user.user_type not in [UserType.ORGANIZATION, UserType.ADMIN]:
            return {"message": "Access Denied"}, 403

        org = g.db.query(Organization).filter_by(id=organization_id).first()
        data = OrganizationSchema().load(request.json)

        for key, value in data.items():
            setattr(org, key, value)

        g.db.add(org)
        g.db.commit()
        return OrganizationSchema().dump(org), 200


class OrganizationUserManagementResource(Resource):
    @check_jwt
    def get(self, organization_id):
        organization_id = validate_uuid(organization_id, load=True)

        if g.user.organization_id != organization_id:
            return {"message": "Not Found"}, 404

        if g.user.user_type not in [UserType.ORGANIZATION, UserType.ADMIN]:
            return {"message": "Access Denied"}, 403

        users = g.db.query(User).filter_by(organization_id=organization_id).all()
        return OrganizationUsersSchema(many=True).dump(users), 200

    @check_jwt
    def post(self, organization_id):
        organization_id = validate_uuid(organization_id, load=True)

        if g.user.organization_id != organization_id:
            return {"message": "Not Found"}, 404

        if g.user.user_type not in [UserType.ORGANIZATION, UserType.ADMIN]:
            return {"message": "Access Denied"}, 403

        data = OrganizationUsersSchema().load(request.json)

        user = create_user(g.db, organization_id=organization_id, **data)
        g.db.add(user)
        g.db.commit()
        return OrganizationUsersSchema().dump(user), 201


class OrganizationUserDetailManagementResource(Resource):
    @check_jwt
    def get(self, organization_id, user_id):
        organization_id = validate_uuid(organization_id, load=True)
        user_id = validate_uuid(user_id, load=True)

        if g.user.organization_id != organization_id:
            return {"message": "Not Found"}, 404

        if g.user.user_type not in [UserType.ORGANIZATION, UserType.ADMIN]:
            return {"message": "Access Denied"}, 403

        user = (
            g.db.query(User)
            .filter_by(
                id=user_id,
                organization_id=organization_id,
            )
            .first()
        )
        if not user:
            return {"message": "Not Found"}, 404
        return OrganizationUsersSchema().dump(user), 200

    @check_jwt
    def put(self, organization_id, user_id):
        organization_id = validate_uuid(organization_id, load=True)
        user_id = validate_uuid(user_id, load=True)

        if g.user.organization_id != organization_id:
            return {"message": "Not Found"}, 404

        if g.user.user_type not in [UserType.ORGANIZATION, UserType.ADMIN]:
            return {"message": "Access Denied"}, 403

        user = (
            g.db.query(User)
            .filter_by(
                id=user_id,
                organization_id=organization_id,
            )
            .first()
        )
        if not user:
            return {"message": "Not Found"}, 404

        data = OrganizationUsersSchema().load(request.json, partial=True)

        for key, value in data.items():
            setattr(user, key, value)

        if "password" in data:
            set_user_password(user, data["password"])

        g.db.add(user)
        g.db.commit()
        return OrganizationUsersSchema().dump(user), 200

    @check_jwt
    def delete(self, organization_id, user_id):
        organization_id = validate_uuid(organization_id, load=True)
        user_id = validate_uuid(user_id, load=True)

        if g.user.organization_id != organization_id:
            return {"message": "Not Found"}, 404

        if g.user.user_type not in [UserType.ORGANIZATION, UserType.ADMIN]:
            return {"message": "Access Denied"}, 403

        user = (
            g.db.query(User)
            .filter_by(
                id=user_id,
                organization_id=organization_id,
            )
            .first()
        )
        user.organization_id = None  # Remove user from organization
        g.db.add(user)
        g.db.commit()
        return "", 204
