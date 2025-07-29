from enum import Enum

from sqlalchemy import JSON, Column, DateTime
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import relationship

from surgicai_api.models import BaseModel
from surgicai_api.models.fields import JsonEncodedDict


class OpNoteStatus(str, Enum):
    """Enum for operative note statuses."""

    DRAFT = "draft"
    OPTIMIZED = "optimized"
    SIGNED = "signed"


class OpNote(BaseModel):
    """Model for operative notes."""

    __tablename__ = "op_notes"

    owner_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String(255), nullable=False)
    status = Column(SqlEnum(OpNoteStatus), nullable=False, default=OpNoteStatus.DRAFT)
    patient_id = Column(String(255), nullable=True)
    patient_first_name = Column(String(100), nullable=True)
    patient_last_name = Column(String(100), nullable=True)
    operation_datetime_start = Column(DateTime, nullable=True)
    operation_datetime_end = Column(DateTime, nullable=True)
    text = Column(Text, nullable=True)
    optimization_metadata = Column(JsonEncodedDict)

    owner = relationship("User", back_populates="op_notes")

    def __repr__(self):
        return f"<OpNote(title={self.title})>"
