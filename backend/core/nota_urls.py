from django.urls import path
from .views import ConsolidarView, ImportarXMLView, SalvarNotaView, ValidarItensView

urlpatterns = [
    path('importar-xml/', ImportarXMLView.as_view()),
    path('validar/', ValidarItensView.as_view()),
    path('consolidar/', ConsolidarView.as_view()),
    path('salvar/', SalvarNotaView.as_view()),
]
