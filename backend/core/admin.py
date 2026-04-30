from django.contrib import admin

from .models import CentroDeTrabalho, Varejista


@admin.register(CentroDeTrabalho)
class CentroDeTrabalhoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'ct', 'uf']
    search_fields = ['nome', 'ct']
    ordering = ['nome']


@admin.register(Varejista)
class VarejistaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cnpj', 'cidade', 'estado', 'ct', 'ativo', 'criado_em']
    list_filter = ['ativo', 'estado', 'cidade']
    search_fields = ['nome', 'cnpj', 'email', 'ct']
    readonly_fields = ['criado_em', 'atualizado_em']
    ordering = ['nome']
