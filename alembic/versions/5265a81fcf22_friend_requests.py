"""friend requests

Revision ID: 5265a81fcf22
Revises: 32df55fb3b92
Create Date: 2026-08-23 12:56:20.235746

"""
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '5265a81fcf22'
down_revision = '32df55fb3b92'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'friend_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('requester_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('addressee_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('status', sa.String(length=15), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_friend_requests_requester', 'friend_requests', ['requester_id'])
    op.create_index('ix_friend_requests_addressee', 'friend_requests', ['addressee_id'])


def downgrade() -> None:
    op.drop_index('ix_friend_requests_addressee', table_name='friend_requests')
    op.drop_index('ix_friend_requests_requester', table_name='friend_requests')
    op.drop_table('friend_requests')
