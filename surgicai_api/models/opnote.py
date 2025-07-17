from enum import Enum

from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import String, Text

from surgicai_api.models import BaseModel


class OpNoteStatus(str, Enum):
    """Enum for operative note statuses."""

    DRAFT = "draft"
    SUBMITTED = "submitted"


class OpNote(BaseModel):
    """Model for operative notes."""

    __tablename__ = "op_notes"

    title = Column(String(255), nullable=False)
    status = Column(SqlEnum(OpNoteStatus), nullable=False, default=OpNoteStatus.DRAFT)
    patient_id = Column(String(255), nullable=True)
    patient_first_name = Column(String(100), nullable=True)
    patient_last_name = Column(String(100), nullable=True)
    operation_datetime_start = Column(DateTime, nullable=True)
    operation_datetime_end = Column(DateTime, nullable=True)
    text = Column(Text, nullable=True)

    def __repr__(self):
        return f"<OpNote(title={self.title})>"
