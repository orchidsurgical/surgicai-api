from copy import deepcopy

import boto3
from flask import current_app


class Boto:
    """
    Wraps the boto3 client.

    NOTE: This requires the following environment variables to be set.

        - AWS_SECRET_KEY_ID
        - AWS_SECRET_ACCESS_KEY
    """

    class _clients:
        @property
        def dynamodb(self):
            return boto3.client(
                "dynamodb",
                endpoint_url=current_app.config.get("DYNAMO_ENDPOINT"),
                config=current_app.config.get("AWS_CLIENT_CONFIG"),
            )

        @property
        def sqs(self):
            return boto3.client(
                "sqs",
                endpoint_url=current_app.config.get("SQS_ENDPOINT"),
                config=current_app.config.get("AWS_CLIENT_CONFIG"),
            )

        @property
        def sts(self):
            return boto3.client(
                "sts",
                endpoint_url=current_app.config.get("STS_ENDPOINT"),
                config=current_app.config.get("AWS_CLIENT_CONFIG"),
            )

    class _resources:
        @property
        def s3(self):
            return boto3.resource(
                "s3", endpoint_url=current_app.config.get("S3_ENDPOINT")
            )

        @property
        def dynamodb(self):
            return boto3.resource(
                "dynamodb", endpoint_url=current_app.config.get("DYNAMO_ENDPOINT")
            )

    def __init__(self):
        self.client = self._clients()
        self.resource = self._resources()
