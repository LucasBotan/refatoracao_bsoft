"""
Modelos de autenticação.

User estende AbstractUser para manter compatibilidade total com o sistema
de autenticação do Django (admin, permissões, etc.) enquanto adiciona
os campos necessários para integração com Azure AD.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Modelo de usuário estendido com dados do Azure Active Directory.

    Campos herdados relevantes de AbstractUser:
        - username, email, first_name, last_name (campos de identidade)
        - is_active, is_staff, is_superuser (controle de acesso Django)
        - date_joined, last_login (auditoria)

    Campos adicionados:
        - microsoft_id: ID único do usuário no Azure AD (imutável, vem do Graph /me.id)
        - microsoft_groups: grupos do Azure AD sincronizados a cada login
    """

    microsoft_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        verbose_name='Microsoft ID',
        help_text='ID único do usuário no Azure Active Directory (campo "id" do Graph /me).',
    )

    microsoft_groups = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Grupos Microsoft',
        help_text=(
            'Lista de displayNames dos grupos do Azure AD. '
            'Atualizada automaticamente a cada login.'
        ),
    )

    # Sobrescrever related_name para evitar conflito de acessor reverso
    # quando AUTH_USER_MODEL aponta para este modelo customizado.
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        related_name='custom_user_set',
        related_query_name='custom_user',
        help_text='The groups this user belongs to.',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        related_name='custom_user_set',
        related_query_name='custom_user',
        help_text='Specific permissions for this user.',
    )

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['email']

    def __str__(self) -> str:
        return self.email or self.username

    def is_in_ms_group(self, group_name: str) -> bool:
        """
        Verifica se o usuário pertence a um grupo do Azure AD.

        A comparação é case-insensitive para evitar falhas por diferença
        de capitalização entre ambientes.

        Args:
            group_name: Nome do grupo a verificar (ex: "ADMIN", "Financeiro")

        Returns:
            True se o usuário for membro do grupo, False caso contrário.
        """
        return group_name.upper() in [g.upper() for g in self.microsoft_groups]
