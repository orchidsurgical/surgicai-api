import uuid

from marshmallow import ValidationError, fields


class StrictUUID(fields.Field):
    default_error_messages = {"invalid_uuid": "Not a valid UUID."}

    def _deserialize(self, value, attr, data, **kwargs):
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, AttributeError, TypeError):
            raise ValidationError(self.error_messages["invalid_uuid"])

    def _serialize(self, value, attr, obj, **kwargs):
        if value is None:
            return None
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, AttributeError, TypeError):
            raise ValidationError(self.error_messages["invalid_uuid"])


def validate_uuid(value):
    """Custom validator to check if a value is a valid UUID."""
    try:
        uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        raise ValidationError("Not a valid UUID.")
    return value
