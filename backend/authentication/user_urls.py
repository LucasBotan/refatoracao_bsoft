"""
URLs relacionadas ao perfil de usuário e seleção de centro de trabalho.

Incluídas na raiz em core/urls.py (sem prefixo de app).
"""
from django.urls import path

from . import views

urlpatterns = [
    # GET /me/ → dados do usuário + centro de trabalho
    path('me/', views.MeView.as_view(), name='me'),

    # POST /usuarios/definir-centro-trabalho/ → associar CT no primeiro acesso
    path(
        'usuarios/definir-centro-trabalho/',
        views.DefinirCentroTrabalhoView.as_view(),
        name='definir-centro-trabalho',
    ),
]
