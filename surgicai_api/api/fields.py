import json
import uuid

import pytz
from flask import g
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


class DateTimeWithTZ(fields.DateTime):
    def _serialize(self, value, attr, obj, **kwargs):
        # On output, convert UTC to user's timezone
        user_tz = getattr(getattr(g, "user", None), "tz", None)
        if value is not None:
            if value.tzinfo is None:
                value = pytz.UTC.localize(value)
            if user_tz:
                value = value.astimezone(user_tz)
            return value.isoformat()
        return None

    def _deserialize(self, value, attr, data, **kwargs):
        # On input, always store as UTC
        user_tz = getattr(getattr(g, "user", None), "tz", None)
        dt = super()._deserialize(value, attr, data, **kwargs)
        if dt.tzinfo is None:
            # Assume naive datetimes are in user's timezone
            if user_tz:
                dt = user_tz.localize(dt)
            else:
                dt = pytz.UTC.localize(dt)
        return dt.astimezone(pytz.UTC)


class JsonEncodedDict(fields.Field):
    def __init__(self, *args, max_size=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.max_size = max_size

    def _serialize(self, value, attr, obj, **kwargs):
        """
        Returns the dictionary.

        NOTE: This is a no-op. The value is already a dictionary when
        it is loaded from the database.
        """
        if value is None:
            return {}

        return value

    def _deserialize(self, value, attr, data, **kwargs):
        """
        Returns the dictionary.
        """
        if value is None:
            return {}

        if not isinstance(value, dict):
            raise ValidationError("Value must be a dict")

        if self.max_size is not None:
            if len(json.dumps(value)) > self.max_size:
                error = f"Dict is too large to serialize. Max size is {self.max_size} bytes."
                raise ValidationError(error)

        return value
