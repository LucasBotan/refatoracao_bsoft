"""
URLs do recurso CentroDeTrabalho.

Incluídas em core/urls.py sob o prefixo /centros-trabalho/.
"""
from django.urls import path

from . import views

urlpatterns = [
    # GET /centros-trabalho/ → lista todos os CTs disponíveis
    path('', views.CentroDeTrabalhoListView.as_view(), name='centros-trabalho-list'),
]
