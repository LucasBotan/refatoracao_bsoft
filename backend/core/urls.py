"""
URL Configuration — ponto de entrada de todas as rotas.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    # Todas as rotas de autenticação Microsoft ficam sob /auth/
    path('auth/', include('authentication.urls')),
]
