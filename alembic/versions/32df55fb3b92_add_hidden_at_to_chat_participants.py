"""add hidden_at to chat_participants

Revision ID: 32df55fb3b92
Revises: d9f65a4999a4
Create Date: 2026-08-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '32df55fb3b92'
down_revision = 'd9f65a4999a4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('chat_participants', sa.Column('hidden_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('chat_participants', 'hidden_at')
