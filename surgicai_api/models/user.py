from enum import Enum

import pytz
from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import String
from sqlalchemy.orm import relationship

from surgicai_api.models.base import BaseModel


class UserType(str, Enum):
    """Enum for user types."""

    ADMIN = "admin"
    SURGEON = "surgeon"
    ORG_ADMIN = "org_admin"
    BILLER = "biller"


class User(BaseModel):
    __tablename__ = "users"

    prefix = Column(String(50), nullable=True)
    first_name = Column(String(55), nullable=False)
    last_name = Column(String(155), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    user_type = Column(SqlEnum(UserType), nullable=False, default=UserType.SURGEON)
    timezone = Column(String(64), nullable=True, default=None)
    last_login = Column(DateTime, nullable=True)

    op_notes = relationship(
        "OpNote", back_populates="owner", lazy="dynamic", passive_deletes=True
    )
    templates = relationship(
        "Template", back_populates="owner", lazy="dynamic", passive_deletes=True
    )

    def __repr__(self):
        return f"<User(email={self.email})>"

    @property
    def full_name(self):
        """Return the full name of the user."""
        parts = [self.prefix, self.first_name, self.last_name]
        parts = filter(None, parts)  # Remove any None values
        return " ".join(parts)

    @property
    def tz(self):
        """Return the timezone of the user as a tzinfo object, or None if not set/invalid."""
        return pytz.timezone(self.timezone) if self.timezone else pytz.utc
