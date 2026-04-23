"""
Serviço MSAL — Microsoft Authentication Library

Encapsula toda interação com a biblioteca MSAL e com o endpoint de token
do Azure AD. A camada de views não deve importar `msal` diretamente.

─────────────────────────────────────────────────────────────────────────────
FLUXO OAUTH2 AUTHORIZATION CODE (resumo):

  1. Usuário acessa GET /auth/login/
  2. Este serviço gera uma URL de autorização incluindo:
       - client_id, redirect_uri, scopes, response_type=code
       - state: token aleatório salvo na sessão (proteção anti-CSRF)
  3. Usuário é redirecionado para login.microsoftonline.com e autentica
  4. Microsoft redireciona para REDIRECT_URI com ?code=AUTH_CODE&state=STATE
  5. Callback valida o state contra o valor salvo na sessão
  6. acquire_token_by_code() troca AUTH_CODE por:
       - access_token  → usado para chamar o Microsoft Graph
       - id_token      → JWT com claims básicas do usuário
       - refresh_token → permite renovar access_token sem novo login
  7. access_token é passado para o graph_service para buscar dados do usuário
─────────────────────────────────────────────────────────────────────────────
"""
import logging

import msal
from django.conf import settings

logger = logging.getLogger(__name__)


class MSALAuthError(Exception):
    """Erro de autenticação retornado pelo Azure AD ou pela biblioteca MSAL."""


def _build_authority() -> str:
    """
    Constrói a URL de autoridade do Azure AD.

    Formato: https://login.microsoftonline.com/{tenant_id}
    O tenant_id pode ser:
      - GUID do tenant (single-tenant)
      - "common"       (multi-tenant + contas pessoais Microsoft)
      - "organizations" (multi-tenant, somente contas corporativas)
    """
    tenant_id = settings.AZURE_AD_TENANT_ID
    if not tenant_id:
        raise MSALAuthError(
            'TENANT_ID não configurado. Verifique o arquivo .env.'
        )
    return f'https://login.microsoftonline.com/{tenant_id}'


def _build_msal_app() -> msal.ConfidentialClientApplication:
    """
    Instancia o ConfidentialClientApplication do MSAL.

    ConfidentialClientApplication é usado para aplicações servidor
    (back-end com client_secret). Distingue-se do PublicClientApplication,
    que é usado em apps mobile/desktop onde o segredo não pode ser protegido.
    """
    client_id = settings.AZURE_AD_CLIENT_ID
    client_secret = settings.AZURE_AD_CLIENT_SECRET

    if not client_id or not client_secret:
        raise MSALAuthError(
            'CLIENT_ID ou CLIENT_SECRET não configurados. Verifique o arquivo .env.'
        )

    return msal.ConfidentialClientApplication(
        client_id=client_id,
        authority=_build_authority(),
        client_credential=client_secret,
    )


def get_auth_url(state: str) -> str:
    """
    Gera a URL de autorização para redirecionar o usuário ao login Microsoft.

    O parâmetro `state` é um token aleatório gerado pela view e salvo na
    sessão do Django. Quando a Microsoft redireciona de volta ao callback,
    o state retornado deve ser igual ao salvo — isso previne CSRF.

    Args:
        state: Token aleatório para validação no callback (ex: secrets.token_urlsafe(32))

    Returns:
        URL completa para redirecionar o navegador do usuário.

    Raises:
        MSALAuthError: Se CLIENT_ID, CLIENT_SECRET ou TENANT_ID não estiverem configurados.
    """
    msal_app = _build_msal_app()

    auth_url = msal_app.get_authorization_request_url(
        scopes=settings.AZURE_AD_SCOPES,
        state=state,
        redirect_uri=settings.AZURE_AD_REDIRECT_URI,
    )

    logger.debug('URL de autorização Azure AD gerada com sucesso.')
    return auth_url


def acquire_token_by_code(auth_code: str) -> dict:
    """
    Troca o código de autorização (AUTH_CODE) por tokens de acesso.

    Este é o passo central do fluxo Authorization Code:
      - O `auth_code` recebido no callback é de uso único e tem validade curta
      - MSAL envia client_id + client_secret + code para o endpoint de token
      - Azure AD retorna access_token, id_token e (opcionalmente) refresh_token

    Args:
        auth_code: Código de autorização recebido via query param `?code=` no callback.

    Returns:
        Dicionário com access_token, id_token, expires_in e outros campos do token.

    Raises:
        MSALAuthError: Se o Azure AD retornar erro ou o token não puder ser obtido.
    """
    msal_app = _build_msal_app()

    result = msal_app.acquire_token_by_authorization_code(
        code=auth_code,
        scopes=settings.AZURE_AD_SCOPES,
        redirect_uri=settings.AZURE_AD_REDIRECT_URI,
    )

    if 'error' in result:
        error = result.get('error', 'unknown_error')
        description = result.get('error_description', 'Sem descrição disponível.')
        logger.error('Falha ao adquirir token MSAL: %s — %s', error, description)
        raise MSALAuthError(f'{error}: {description}')

    logger.debug('Token MSAL adquirido com sucesso para o usuário.')
    return result
