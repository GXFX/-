"""add username to users

Revision ID: 05ac3515424e
Revises: 32df55fb3b92
Create Date: 2026-08-23 20:22:03.316113

"""
from alembic import op
import sqlalchemy as sa

revision = '05ac3515424e'
down_revision = '5265a81fcf22'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. добавляем колонку сначала БЕЗ NOT NULL — иначе упадёт на
    #    существующих юзерах, у которых ещё нет username
    op.add_column('users', sa.Column('username', sa.String(length=30), nullable=True))

    # 2. бэкфиллим существующих юзеров временным уникальным ником
    #    вида user_XXXXXXXX (первые 8 символов UUID) — потом можно
    #    заменить на красивую генерацию (прилагательное+существительное
    #    и т.п.), это просто чтобы не было NULL/дублей
    op.execute(
        "UPDATE users SET username = 'user_' || substr(id::text, 1, 8) "
        "WHERE username IS NULL"
    )

    # 3. теперь можно сделать обязательным
    op.alter_column('users', 'username', nullable=False)

    # 4. уникальный индекс
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'username')
