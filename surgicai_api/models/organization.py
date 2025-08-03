from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.orm import relationship

from surgicai_api.models.base import BaseModel


class Organization(BaseModel):
    """Model for organizations."""

    __tablename__ = "organizations"

    name = Column(String(255), nullable=False, unique=True)
    description = Column(String(512), nullable=True)

    users = relationship(
        "User",
        back_populates="organization",
        lazy="dynamic",
        passive_deletes=True,
    )

    def __repr__(self):
        return f"<Organization(name={self.name})>"
