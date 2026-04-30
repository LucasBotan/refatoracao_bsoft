"""
URL Configuration — ponto de entrada de todas as rotas.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    # Fluxo OAuth2 e recursos protegidos por grupo
    path('auth/', include('authentication.urls')),
    # Perfil do usuário e seleção de centro de trabalho (primeiro acesso)
    path('', include('authentication.user_urls')),
    # CRUD de varejistas — /varejistas/ e /varejistas/{pk}/
    path('varejistas/', include('core.varejistas_urls')),
    # Listagem de centros de trabalho — /centros-trabalho/
    path('centros-trabalho/', include('core.centros_trabalho_urls')),
    # Importação de NF-e via XML — /notas/importar-xml/ etc.
    path('notas/', include('core.nota_urls')),
    # Cadastro de códigos de cliente — /codigo-cliente/ e /codigo-cliente/{pk}/
    path('codigo-cliente/', include('core.codigo_cliente_urls')),
]
