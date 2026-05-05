from django.contrib import admin

from .models import CentroDeTrabalho, CodigoCliente, ItemNotaFiscal, NotaFiscal, Varejista


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


@admin.register(CodigoCliente)
class CodigoClienteAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'varejista', 'centro_de_trabalho', 'necessita_saida']
    list_filter = ['necessita_saida', 'centro_de_trabalho']
    search_fields = ['codigo', 'varejista__nome']
    ordering = ['varejista', 'codigo']


class ItemNotaFiscalInline(admin.TabularInline):
    model = ItemNotaFiscal
    extra = 0
    fields = ['codigo_varejo', 'descricao', 'ean', 'quantidade', 'valor_unitario', 'gera_saida', 'status', 'quantidade_restante']
    readonly_fields = ['gera_saida', 'quantidade_restante', 'status']


@admin.register(NotaFiscal)
class NotaFiscalAdmin(admin.ModelAdmin):
    list_display = ['numero', 'serie', 'varejista', 'centro_de_trabalho', 'data_emissao', 'valor_total', 'criado_em']
    list_filter = ['centro_de_trabalho', 'varejista', 'data_emissao']
    search_fields = ['numero', 'serie', 'chave_acesso', 'varejista__nome']
    readonly_fields = ['criado_em', 'atualizado_em']
    ordering = ['-criado_em']
    inlines = [ItemNotaFiscalInline]


@admin.register(ItemNotaFiscal)
class ItemNotaFiscalAdmin(admin.ModelAdmin):
    list_display = ['codigo_varejo', 'descricao', 'nota_fiscal', 'ean', 'ncm', 'quantidade', 'valor_unitario', 'quantidade_restante', 'gera_saida', 'status']
    list_filter = ['status', 'gera_saida']
    search_fields = ['codigo_varejo', 'descricao', 'ean']
    ordering = ['nota_fiscal', 'codigo_varejo']
