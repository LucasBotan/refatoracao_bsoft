from django.urls import path
from .views import CodigoClienteDetailView, CodigoClienteView

urlpatterns = [
    path('', CodigoClienteView.as_view()),
    path('<int:pk>/', CodigoClienteDetailView.as_view()),
]
