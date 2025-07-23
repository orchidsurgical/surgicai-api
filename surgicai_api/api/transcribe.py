import json

from flask import current_app, g, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError, fields

from surgicai_api.boto import Boto
from surgicai_api.ssr.views import check_jwt

# Optional: a policy restricting transcribe permissions even further
TRANSCRIBE_POLICY = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["transcribe:StartMedicalStreamTranscription"],
            "Resource": "*",
        }
    ],
}


boto = Boto()


class TranscribeCredentialsSchema(Schema):
    AccessKeyId = fields.Str(required=True)
    SecretAccessKey = fields.Str(required=True)
    SessionToken = fields.Str(required=True)
    Expiration = fields.Str(required=True)


class TranscribeCredentialsResource(Resource):
    method_decorators = [check_jwt]

    def get(self):
        """
        Get AWS Transcribe credentials.
        """
        rep = boto.client.sts.assume_role(
            RoleArn=current_app.config["TRANSCRIBE_ROLE_ARN"],
            RoleSessionName="surgicai-web-transcribe-session",
            DurationSeconds=current_app.config.get("TRANSCRIBE_SESSION_DURATION", 3600),
            Policy=json.dumps(TRANSCRIBE_POLICY),
        )
        creds = rep["Credentials"]
        return (
            TranscribeCredentialsSchema().dump(
                {
                    "AccessKeyId": creds["AccessKeyId"],
                    "SecretAccessKey": creds["SecretAccessKey"],
                    "SessionToken": creds["SessionToken"],
                    "Expiration": creds["Expiration"],
                }
            ),
            200,
        )
