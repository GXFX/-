"""add last_read_at to chat_participants

Revision ID: d9f65a4999a4
Revises: 0001_initial
Create Date: 2026-08-23 00:02:02.258698

"""
from alembic import op
import sqlalchemy as sa


revision = 'd9f65a4999a4'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('chat_participants', sa.Column('last_read_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('chat_participants', 'last_read_at')