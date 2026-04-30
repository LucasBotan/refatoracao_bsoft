"""
Serializers da app de autenticação.

Representam o contrato de dados exposto pelos endpoints de API.
Não contêm regras de negócio — apenas mapeamento e validação de campos.
"""
from typing import Optional

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer de leitura para dados do usuário autenticado.

    Expõe campos necessários para o frontend identificar e personalizar
    a experiência do usuário. Todos os campos são read-only — o perfil
    é gerenciado exclusivamente via Azure AD.
    """

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'microsoft_id',
            'microsoft_groups',
        ]
        # Dados do perfil vêm do Azure AD — nunca devem ser alterados via API
        read_only_fields = fields


class MeSerializer(serializers.Serializer):
    """
    Contrato do endpoint GET /me/.

    Retorna dados do usuário autenticado com informações de centro de trabalho.
    `usuario_sem_ct=true` indica que o frontend deve redirecionar para seleção de CT.
    """

    nome = serializers.SerializerMethodField()
    email = serializers.EmailField()
    ct = serializers.SerializerMethodField()
    nome_centro_trabalho = serializers.SerializerMethodField()
    usuario_sem_ct = serializers.SerializerMethodField()

    def get_nome(self, user) -> str:
        return user.get_full_name() or user.username

    def get_ct(self, user) -> Optional[str]:
        return user.ct

    def get_nome_centro_trabalho(self, user) -> Optional[str]:
        return user.centro_trabalho.nome if user.centro_trabalho else None

    def get_usuario_sem_ct(self, user) -> bool:
        return user.centro_trabalho_id is None


class DefinirCentroTrabalhoSerializer(serializers.Serializer):
    """
    Contrato do endpoint POST /usuarios/definir-centro-trabalho/.

    Valida que o `centro_trabalho_id` informado existe no banco.
    """

    centro_trabalho_id = serializers.IntegerField()

    def validate_centro_trabalho_id(self, value: int) -> int:
        from core.models import CentroDeTrabalho
        if not CentroDeTrabalho.objects.filter(pk=value).exists():
            raise serializers.ValidationError('Centro de trabalho não encontrado.')
        return value
