"""
Serializers do app core.

Representam o contrato de dados dos endpoints REST.
Validações de formato básico ficam aqui; regras de negócio pertencem ao serviço.
"""
from rest_framework import serializers

from .models import CentroDeTrabalho, CodigoCliente, ItemNotaFiscal, NotaFiscal, Varejista


# ── CentroDeTrabalho ──────────────────────────────────────────────────────────

class CentroDeTrabalhoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CentroDeTrabalho
        fields = ['id', 'ct', 'nome', 'uf']
        read_only_fields = fields


# ── Varejista ─────────────────────────────────────────────────────────────────

class VarejistaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Varejista
        fields = [
            'id', 'nome', 'cnpj', 'consumidor', 'telefone', 'email',
            'cep', 'endereco', 'numero', 'bairro', 'complemento',
            'cidade', 'estado', 'ct', 'ativo', 'criado_em', 'atualizado_em',
        ]
        read_only_fields = ['id', 'ativo', 'criado_em', 'atualizado_em']


# ── CodigoCliente ─────────────────────────────────────────────────────────────

class CodigoClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodigoCliente
        fields = ['id', 'codigo', 'varejista', 'centro_de_trabalho', 'necessita_saida']
        read_only_fields = ['id', 'centro_de_trabalho']


class CodigoClienteInputSerializer(serializers.Serializer):
    codigo = serializers.CharField(max_length=60)
    varejista_id = serializers.IntegerField()
    necessita_saida = serializers.BooleanField(default=True)


# ── Nota Fiscal — leitura (modelo persistido) ─────────────────────────────────

class ItemNotaFiscalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemNotaFiscal
        fields = [
            'id', 'codigo_varejo', 'descricao', 'ean', 'ncm',
            'quantidade', 'valor_unitario', 'quantidade_restante',
            'gera_saida', 'status',
        ]
        read_only_fields = fields


class NotaFiscalSerializer(serializers.ModelSerializer):
    itens = ItemNotaFiscalSerializer(many=True, read_only=True)

    class Meta:
        model = NotaFiscal
        fields = [
            'id', 'numero', 'serie', 'chave_acesso', 'protocolo',
            'data_emissao', 'valor_total', 'observacao',
            'varejista', 'centro_de_trabalho',
            'criado_em', 'atualizado_em', 'itens',
        ]
        read_only_fields = fields


# ── Nota Fiscal — fluxo de importação (preview, não persistido) ───────────────

class ItemPreviewSerializer(serializers.Serializer):
    """Item processado retornado no preview (importar-xml, validar, consolidar)."""
    codigo_varejo = serializers.CharField()
    descricao = serializers.CharField()
    ean = serializers.CharField(allow_blank=True, default='')
    ncm = serializers.CharField(allow_blank=True, default='')
    quantidade = serializers.IntegerField()
    valor_unitario = serializers.DecimalField(max_digits=15, decimal_places=4)
    status = serializers.CharField()
    gera_saida = serializers.BooleanField()
    quantidade_restante = serializers.IntegerField()


class NotaPreviewSerializer(serializers.Serializer):
    """Dados do cabeçalho da nota no preview."""
    numero = serializers.CharField()
    serie = serializers.CharField()
    chave_acesso = serializers.CharField(allow_blank=True, default='')
    protocolo = serializers.CharField(allow_blank=True, default='')
    data_emissao = serializers.DateTimeField()
    valor_total = serializers.DecimalField(max_digits=15, decimal_places=2)
    varejista_id = serializers.IntegerField()
    observacao = serializers.CharField(allow_blank=True, default='', required=False)


class ImportarXMLInputSerializer(serializers.Serializer):
    xml = serializers.CharField(help_text='Conteúdo do XML de NF-e (string UTF-8).')
    varejista_id = serializers.IntegerField()


class ImportarXMLResponseSerializer(serializers.Serializer):
    nota = NotaPreviewSerializer()
    itens = ItemPreviewSerializer(many=True)
    pode_concluir = serializers.BooleanField()


class ValidarItensInputSerializer(serializers.Serializer):
    varejista_id = serializers.IntegerField()
    itens = ItemPreviewSerializer(many=True)


class ConsolidarInputSerializer(serializers.Serializer):
    itens = ItemPreviewSerializer(many=True)


class SalvarNotaInputSerializer(serializers.Serializer):
    nota = NotaPreviewSerializer()
    itens = ItemPreviewSerializer(many=True)
    varejista_id = serializers.IntegerField()
