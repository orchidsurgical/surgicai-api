import datetime
import uuid

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class BaseModel(Base):
    """Base model class for all database models."""

    __abstract__ = True

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.datetime.now(tz=datetime.timezone.utc),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.datetime.now(tz=datetime.timezone.utc),
        onupdate=datetime.datetime.now(tz=datetime.timezone.utc),
    )

    def __repr__(self):
        return f"<BaseModel(id={self.id})>"
