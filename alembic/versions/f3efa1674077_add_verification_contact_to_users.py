"""add verification_contact to users

Revision ID: f3efa1674077
Revises: 15490d767733
Create Date: 2026-08-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'f3efa1674077'
down_revision = '15490d767733'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('verification_contact', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'verification_contact')