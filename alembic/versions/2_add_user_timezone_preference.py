"""add user timezone preference

Revision ID: 2
Revises: 1
Create Date: 2025-07-18 14:29:00.126541

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2"
down_revision: Union[str, None] = "1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_unique_constraint(None, "op_notes", ["id"])
    op.add_column("users", sa.Column("timezone", sa.String(length=64), nullable=True))
    op.create_unique_constraint(None, "users", ["id"])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, "users", type_="unique")
    op.drop_column("users", "timezone")
    op.drop_constraint(None, "op_notes", type_="unique")
    # ### end Alembic commands ###
