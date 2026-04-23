"""
Serializers da app de autenticação.

Representam o contrato de dados exposto pelos endpoints de API.
Não contêm regras de negócio — apenas mapeamento e validação de campos.
"""
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
