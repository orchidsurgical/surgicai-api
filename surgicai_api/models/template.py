from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from surgicai_api.models import BaseModel


class Template(BaseModel):
    """Model for templates."""

    __tablename__ = "templates"

    owner_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False)
    text = Column(Text, nullable=True)

    owner = relationship("User", back_populates="templates")

    def __repr__(self):
        return f"<Template(title={self.name})>"
