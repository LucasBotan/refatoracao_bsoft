"""
Serviço Microsoft Graph API

Responsável por consumir os endpoints do Microsoft Graph usando o
access_token obtido pelo fluxo MSAL. Nenhuma lógica de autenticação
deve residir aqui — este serviço apenas faz chamadas HTTP ao Graph.

Endpoints utilizados:
  - GET /me            → dados básicos do usuário autenticado
  - GET /me/memberOf   → grupos e roles do usuário (com paginação)

Documentação:
  https://learn.microsoft.com/en-us/graph/api/overview
"""
import logging
from typing import Optional

import requests

logger = logging.getLogger(__name__)

GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'
REQUEST_TIMEOUT = 10  # segundos


class GraphAPIError(Exception):
    """Erro ao chamar a Microsoft Graph API."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


def _auth_headers(access_token: str) -> dict:
    """Monta os headers de autenticação para chamadas ao Graph."""
    return {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
    }


def _check_response(response: requests.Response, context: str) -> dict:
    """
    Valida resposta HTTP e retorna o JSON ou lança GraphAPIError.

    Args:
        response: Resposta da requisição.
        context:  Descrição do endpoint chamado (para mensagens de erro).
    """
    if response.ok:
        return response.json()

    # Tentar extrair mensagem de erro do corpo da resposta Graph
    try:
        error_body = response.json()
        error_message = error_body.get('error', {}).get('message', response.text)
    except Exception:
        error_message = response.text

    logger.error(
        'Erro na chamada Graph [%s]: HTTP %d — %s',
        context,
        response.status_code,
        error_message,
    )
    raise GraphAPIError(
        f'Falha ao {context}: HTTP {response.status_code} — {error_message}',
        status_code=response.status_code,
    )


def get_user_profile(access_token: str) -> dict:
    """
    Obtém o perfil básico do usuário autenticado via GET /me.

    Campos retornados pelo Graph (seleção padrão):
      - id              → ID único no Azure AD (imutável)
      - displayName     → nome completo
      - mail            → endereço de e-mail principal
      - userPrincipalName → UPN (geralmente idêntico ao mail em ambientes corporativos)

    Args:
        access_token: Token obtido via MSAL com escopo User.Read.

    Returns:
        Dicionário com dados do perfil.

    Raises:
        GraphAPIError: Se a chamada ao Graph falhar.
    """
    url = f'{GRAPH_BASE_URL}/me'
    response = requests.get(
        url,
        headers=_auth_headers(access_token),
        timeout=REQUEST_TIMEOUT,
    )
    return _check_response(response, 'obter perfil do usuário (/me)')


def get_user_groups(access_token: str) -> list[dict]:
    """
    Obtém todos os grupos do Azure AD aos quais o usuário pertence.

    Endpoint: GET /me/memberOf
    Escopo necessário: GroupMember.Read.All

    PAGINAÇÃO:
      O Graph retorna no máximo 100 itens por página. Quando há mais
      resultados, a resposta inclui a chave '@odata.nextLink' com a URL
      da próxima página. Este método percorre todas as páginas e agrega
      os resultados antes de retornar.

    FILTRAGEM:
      /me/memberOf retorna também directoryRoles e outros tipos.
      Filtramos apenas objetos do tipo '#microsoft.graph.group'.

    Args:
        access_token: Token obtido via MSAL com escopo GroupMember.Read.All.

    Returns:
        Lista de dicionários com dados dos grupos (id, displayName, etc.).
        Retorna lista vazia se o usuário não pertencer a nenhum grupo.

    Raises:
        GraphAPIError: Se qualquer chamada ao Graph falhar.
    """
    url = f'{GRAPH_BASE_URL}/me/memberOf'
    all_groups: list[dict] = []
    page_count = 0

    # Percorre todas as páginas até não haver mais '@odata.nextLink'
    while url:
        page_count += 1
        logger.debug('Buscando grupos — página %d: %s', page_count, url)

        response = requests.get(
            url,
            headers=_auth_headers(access_token),
            timeout=REQUEST_TIMEOUT,
        )
        data = _check_response(response, f'obter grupos do usuário (página {page_count})')

        # Filtrar somente grupos (descarta directoryRoles, adminUnits, etc.)
        page_groups = [
            item
            for item in data.get('value', [])
            if item.get('@odata.type') == '#microsoft.graph.group'
        ]
        all_groups.extend(page_groups)

        # Próxima página (None encerra o loop)
        url = data.get('@odata.nextLink')

    logger.debug(
        'Total de grupos encontrados: %d (em %d página(s))',
        len(all_groups),
        page_count,
    )
    return all_groups
