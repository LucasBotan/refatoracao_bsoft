"""
Views de autenticação Microsoft.

Responsabilidade exclusiva: controle de fluxo HTTP.
  - Receber request, extrair parâmetros, chamar serviços, retornar response.
  - Nenhuma lógica de autenticação, token ou Graph deve residir aqui.

Serviços utilizados:
  - msal_service   → geração de URL e troca de código por token
  - graph_service  → chamadas ao Microsoft Graph (/me e /me/memberOf)
  - user_service   → criação/atualização do usuário local
"""
import logging
import secrets
import urllib.parse

from django.conf import settings
from django.shortcuts import redirect
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsInGroup
from .serializers import UserSerializer
from .services import graph_service, msal_service, user_service

logger = logging.getLogger(__name__)


class LoginView(APIView):
    """
    Inicia o fluxo OAuth2 redirecionando o usuário para a Microsoft.

    GET /auth/login/

    Fluxo:
      1. Gera um token `state` aleatório e salva na sessão Django (anti-CSRF).
      2. Obtém a URL de autorização via msal_service.
      3. Redireciona o navegador para login.microsoftonline.com.
    """

    permission_classes = []  # endpoint público — não requer autenticação prévia

    def get(self, request):
        # Token aleatório de 32 bytes (URL-safe) para validação no callback
        state = secrets.token_urlsafe(32)
        request.session['oauth_state'] = state

        try:
            auth_url = msal_service.get_auth_url(state=state)
        except msal_service.MSALAuthError as exc:
            logger.error('Falha ao gerar URL de autorização: %s', exc)
            return Response(
                {'error': 'configuration_error', 'message': str(exc)},
                status=500,
            )

        return redirect(auth_url)


class CallbackView(APIView):
    """
    Processa o retorno da Microsoft após o login do usuário.

    GET /auth/callback/?code=AUTH_CODE&state=STATE

    Fluxo completo:
      1. Verifica se a Microsoft retornou algum erro (ex.: usuário cancelou).
      2. Valida o `state` contra o valor salvo na sessão (proteção anti-CSRF).
      3. Troca o `code` por access_token via MSAL.
      4. Busca perfil e grupos do usuário no Microsoft Graph.
      5. Cria ou atualiza o usuário local (upsert por microsoft_id).
      6. Gera e retorna um JWT interno para uso nas próximas chamadas.
    """

    permission_classes = []  # endpoint público — recebe o callback OAuth2

    def get(self, request):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

        def _redirect_error(code: str) -> 'redirect':
            """Redireciona para a tela de login com código de erro no hash."""
            return redirect(f'{frontend_url}/login#error={code}')

        # ── 1. Verificar erros vindos da Microsoft ────────────────────────
        error = request.query_params.get('error')
        if error:
            error_description = request.query_params.get('error_description', '')
            logger.warning('Erro no callback OAuth2: %s — %s', error, error_description)
            return _redirect_error('provider_error')

        # ── 2. Validar state (proteção anti-CSRF) ─────────────────────────
        received_state = request.query_params.get('state')
        expected_state = request.session.pop('oauth_state', None)

        if not received_state or received_state != expected_state:
            logger.warning(
                'State OAuth2 inválido: recebido="%s", esperado="%s"',
                received_state,
                expected_state,
            )
            return _redirect_error('invalid_state')

        auth_code = request.query_params.get('code')
        if not auth_code:
            return _redirect_error('missing_code')

        # ── 3. Trocar código por access_token via MSAL ────────────────────
        try:
            token_result = msal_service.acquire_token_by_code(auth_code)
        except msal_service.MSALAuthError as exc:
            logger.error('Falha na troca de código MSAL: %s', exc)
            return _redirect_error('token_acquisition_failed')

        access_token = token_result['access_token']

        # ── 4. Buscar dados do usuário no Microsoft Graph ─────────────────
        try:
            profile = graph_service.get_user_profile(access_token)
            ms_groups = graph_service.get_user_groups(access_token)
        except graph_service.GraphAPIError as exc:
            logger.error('Falha ao consultar Microsoft Graph: %s', exc)
            return _redirect_error('graph_api_error')

        # ── 5. Criar ou atualizar usuário local ───────────────────────────
        user = user_service.get_or_create_user(profile=profile, ms_groups=ms_groups)

        # ── 6. Gerar JWT interno ──────────────────────────────────────────
        # SimpleJWT cria access_token (curta duração) e refresh_token
        refresh = RefreshToken.for_user(user)

        # Redireciona para o frontend com os tokens no fragmento de URL (#).
        # O hash não é enviado a nenhum servidor, mas fica no histórico do
        # navegador. Risco documentado — ver ADR de autenticação.
        # TODO: migrar para BFF com cookies HttpOnly em produção.
        fragment = urllib.parse.urlencode({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        })
        return redirect(f'{frontend_url}/callback#{fragment}')


class ProfileView(APIView):
    """
    Endpoint protegido — retorna os dados do usuário autenticado.

    GET /auth/profile/

    Requer: Authorization: Bearer <access_token>
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AdminOnlyView(APIView):
    """
    Endpoint restrito ao grupo "ADMIN" do Azure AD.

    GET /auth/admin-resource/

    Requer:
      - Authorization: Bearer <access_token>
      - Usuário pertencer ao grupo "ADMIN" no Azure AD

    Retorna 403 se o token for válido mas o usuário não estiver no grupo.
    """

    permission_classes = [IsAuthenticated, IsInGroup('ADMIN')]

    def get(self, request):
        return Response({
            'message': 'Acesso autorizado ao recurso administrativo.',
            'user': request.user.email,
            'microsoft_groups': request.user.microsoft_groups,
        })


class FinanceView(APIView):
    """
    Endpoint restrito ao grupo "FINANCEIRO" do Azure AD.

    GET /auth/finance-resource/

    Demonstra restrição por grupo diferente do ADMIN.
    Usuários do grupo FINANCEIRO OU ADMIN têm acesso.
    """

    permission_classes = [
        IsAuthenticated,
        IsInGroup('FINANCEIRO') | IsInGroup('ADMIN'),
    ]

    def get(self, request):
        return Response({
            'message': 'Acesso autorizado ao recurso financeiro.',
            'user': request.user.email,
            'microsoft_groups': request.user.microsoft_groups,
        })
