"""
URLs de varejistas.

Prefixo base: /varejistas/  (definido em core/urls.py)
"""
from django.urls import path

from . import views

urlpatterns = [
    # GET  /varejistas/      → listar (paginado, filtros via query params)
    # POST /varejistas/      → criar
    path('', views.VarejistaListView.as_view(), name='varejista-list'),

    # GET    /varejistas/{pk}/  → detalhar
    # PUT    /varejistas/{pk}/  → atualizar
    # DELETE /varejistas/{pk}/  → inativar (soft delete)
    path('<int:pk>/', views.VarejistaDetailView.as_view(), name='varejista-detail'),
]
