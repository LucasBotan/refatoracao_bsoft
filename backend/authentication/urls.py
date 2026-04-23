"""
URLs do app de autenticação Microsoft.

Prefixo base: /auth/  (definido em core/urls.py)
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    # ── Fluxo OAuth2 ──────────────────────────────────────────────────────
    # Passo 1: iniciar login → redireciona para Microsoft
    path('login/', views.LoginView.as_view(), name='auth-login'),

    # Passo 2: Microsoft redireciona de volta aqui com ?code=...&state=...
    path('callback/', views.CallbackView.as_view(), name='auth-callback'),

    # ── JWT ───────────────────────────────────────────────────────────────
    # Renovar access_token usando refresh_token
    # POST /auth/token/refresh/  body: { "refresh": "<refresh_token>" }
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # ── Endpoints protegidos ──────────────────────────────────────────────
    # Requer: Authorization: Bearer <access_token>
    path('profile/', views.ProfileView.as_view(), name='auth-profile'),

    # Requer: grupo ADMIN
    path('admin-resource/', views.AdminOnlyView.as_view(), name='auth-admin-resource'),

    # Requer: grupo FINANCEIRO ou ADMIN
    path('finance-resource/', views.FinanceView.as_view(), name='auth-finance-resource'),
]
