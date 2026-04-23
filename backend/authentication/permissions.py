"""
Permissões customizadas para controle de acesso baseado em grupos do Azure AD.
"""
import logging

from rest_framework.permissions import BasePermission

logger = logging.getLogger(__name__)


def IsInGroup(group_name: str) -> type:
    """
    Fábrica que retorna uma classe de permissão DRF verificando se o
    usuário autenticado pertence ao grupo Azure AD especificado.

    Como funciona:
      - DRF espera que `permission_classes` contenha *classes*, não instâncias.
      - Esta fábrica recebe o nome do grupo e retorna uma classe configurada,
        que o DRF instancia normalmente ao processar cada request.
      - A verificação delega para User.is_in_ms_group(), que é case-insensitive.

    Uso em views:
        class AdminView(APIView):
            permission_classes = [IsAuthenticated, IsInGroup('ADMIN')]

    Uso com múltiplos grupos (OR — qualquer um dos grupos):
        class FinanceView(APIView):
            permission_classes = [IsAuthenticated, IsInGroup('FINANCEIRO') | IsInGroup('ADMIN')]

    Args:
        group_name: Nome do grupo do Azure AD (comparação case-insensitive).

    Returns:
        Classe BasePermission configurada para o grupo.
    """

    class GroupPermission(BasePermission):
        # Mensagem retornada ao cliente quando o acesso é negado
        message = (
            f"Acesso negado: seu usuário não pertence ao grupo '{group_name}' "
            f"necessário para acessar este recurso."
        )

        def has_permission(self, request, view) -> bool:
            if not request.user or not request.user.is_authenticated:
                return False

            has_access = request.user.is_in_ms_group(group_name)

            if not has_access:
                logger.warning(
                    'Acesso negado ao usuário "%s" (grupo exigido: "%s", grupos atuais: %s)',
                    request.user.email,
                    group_name,
                    request.user.microsoft_groups,
                )

            return has_access

    # Nomear a classe para facilitar leitura em logs e tracebacks
    GroupPermission.__name__ = f'IsInGroup_{group_name}'
    GroupPermission.__qualname__ = f'IsInGroup_{group_name}'

    return GroupPermission
