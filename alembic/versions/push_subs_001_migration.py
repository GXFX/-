"""push subscriptions

Revision ID: push_subs_001
Revises: f3efa1674077
Create Date: 2026-08-26

"""
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'push_subs_001'
down_revision = 'f3efa1674077'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'push_subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('endpoint', sa.Text(), nullable=False),
        sa.Column('p256dh', sa.String(length=255), nullable=False),
        sa.Column('auth', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_unique_constraint('uq_push_subscriptions_endpoint', 'push_subscriptions', ['endpoint'])
    op.create_index('ix_push_subscriptions_user', 'push_subscriptions', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_push_subscriptions_user', table_name='push_subscriptions')
    op.drop_constraint('uq_push_subscriptions_endpoint', 'push_subscriptions', type_='unique')
    op.drop_table('push_subscriptions')
