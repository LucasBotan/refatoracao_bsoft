"""
Modelos do app core.

CentroDeTrabalho representa uma filial/unidade operacional.
Varejista representa o cadastro de clientes varejistas.
NotaFiscal / ItemNotaFiscal cobrem o fluxo de entrada de NF-e via XML.
CodigoCliente mapeia o código do produto no varejista ao produto interno.
Remoção lógica via campo `ativo` — registros nunca são excluídos fisicamente.
"""
from django.db import models


class CentroDeTrabalho(models.Model):
    """
    Representa uma filial ou unidade operacional do sistema.

    Pressupostos:
        - `ct` é a chave de negócio — deve ser único e imutável após criação.
        - Usuários são associados a um CT; queries de negócio devem sempre
          filtrar por `request.user.centro_trabalho`.
    """

    ct = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        verbose_name='CT',
        help_text='Código do centro de trabalho. Deve ser único.',
    )
    nome = models.CharField(
        max_length=255,
        verbose_name='Nome',
        help_text='Nome do centro de trabalho.',
    )
    uf = models.CharField(
        max_length=2,
        verbose_name='UF',
        help_text='Sigla do estado (ex.: SP, MG).',
    )

    class Meta:
        verbose_name = 'Centro de Trabalho'
        verbose_name_plural = 'Centros de Trabalho'
        ordering = ['nome']

    def __str__(self) -> str:
        return f'{self.nome} ({self.ct})'


class Varejista(models.Model):
    """
    Cadastro de varejistas.

    Pressupostos:
        - `cnpj` é armazenado normalizado no formato XX.XXX.XXX/XXXX-XX.
        - `consumidor` é uma string livre de classificação (ex.: 'B2B', 'B2C').
          Tratado como string por ausência de padrão boolean equivalente no sistema.
        - `ativo=False` equivale a exclusão lógica — registros inativos não aparecem
          nos endpoints públicos sem parâmetro explícito.
    """

    nome = models.CharField(
        max_length=255,
        verbose_name='Nome',
        help_text='Razão social ou nome fantasia do varejista.',
    )
    cnpj = models.CharField(
        max_length=18,
        unique=True,
        db_index=True,
        verbose_name='CNPJ',
        help_text='CNPJ no formato XX.XXX.XXX/XXXX-XX. Deve ser único.',
    )
    consumidor = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Consumidor',
        help_text='Classificação do tipo de consumidor (ex.: B2B, B2C, Varejo).',
    )
    telefone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Telefone',
        help_text='Telefone de contato com DDD.',
    )
    email = models.EmailField(
        blank=True,
        verbose_name='E-mail',
        help_text='E-mail de contato.',
    )
    cep = models.CharField(
        max_length=9,
        blank=True,
        verbose_name='CEP',
        help_text='CEP no formato XXXXX-XXX.',
    )
    endereco = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Endereço',
        help_text='Logradouro sem número.',
    )
    numero = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Número',
        help_text='Número do endereço.',
    )
    bairro = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Bairro',
    )
    complemento = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Complemento',
    )
    cidade = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Cidade',
    )
    estado = models.CharField(
        max_length=2,
        blank=True,
        verbose_name='Estado',
        help_text='Sigla UF com 2 letras (ex.: SP, MG).',
    )
    ct = models.CharField(
        max_length=255,
        verbose_name='CT',
        help_text='Código de tomador. Campo obrigatório.',
    )
    ativo = models.BooleanField(
        default=True,
        verbose_name='Ativo',
        help_text='Registros inativos são tratados como excluídos logicamente.',
    )
    criado_em = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Criado em',
    )
    atualizado_em = models.DateTimeField(
        auto_now=True,
        verbose_name='Atualizado em',
    )

    class Meta:
        verbose_name = 'Varejista'
        verbose_name_plural = 'Varejistas'
        ordering = ['nome']

    def __str__(self) -> str:
        return f'{self.nome} ({self.cnpj})'


class CodigoCliente(models.Model):
    """
    Mapeia o código de produto usado pelo varejista ao cadastro interno.

    Pressupostos:
        - A unicidade é garantida por (codigo, varejista, centro_de_trabalho).
        - `necessita_saida=True` indica que o item deve gerar um lançamento de saída.
        - Escopo sempre limitado ao CT do usuário.
    """

    codigo = models.CharField(
        max_length=60,
        verbose_name='Código',
        help_text='Código do produto no sistema do varejista.',
    )
    varejista = models.ForeignKey(
        'Varejista',
        on_delete=models.CASCADE,
        related_name='codigos_cliente',
        verbose_name='Varejista',
    )
    centro_de_trabalho = models.ForeignKey(
        'CentroDeTrabalho',
        on_delete=models.CASCADE,
        related_name='codigos_cliente',
        verbose_name='Centro de Trabalho',
    )
    necessita_saida = models.BooleanField(
        default=True,
        verbose_name='Necessita Saída',
        help_text='Se verdadeiro, o item gera lançamento de saída.',
    )

    class Meta:
        verbose_name = 'Código de Cliente'
        verbose_name_plural = 'Códigos de Cliente'
        unique_together = ('codigo', 'varejista', 'centro_de_trabalho')

    def __str__(self) -> str:
        return f'{self.codigo} — {self.varejista}'


class NotaFiscal(models.Model):
    """
    Cabeçalho de nota fiscal importada via XML de NF-e.

    A unicidade por (numero, serie, varejista, centro_de_trabalho) impede
    importações duplicadas. O CT é sempre obtido de request.user.centro_trabalho.
    """

    numero = models.CharField(max_length=20, verbose_name='Número')
    serie = models.CharField(max_length=5, verbose_name='Série')
    chave_acesso = models.CharField(max_length=44, blank=True, verbose_name='Chave de Acesso')
    protocolo = models.CharField(max_length=50, blank=True, verbose_name='Protocolo')
    data_emissao = models.DateTimeField(verbose_name='Data de Emissão')
    valor_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name='Valor Total',
    )
    observacao = models.TextField(blank=True, verbose_name='Observação')
    varejista = models.ForeignKey(
        'Varejista',
        on_delete=models.PROTECT,
        related_name='notas_fiscais',
        verbose_name='Varejista',
    )
    centro_de_trabalho = models.ForeignKey(
        'CentroDeTrabalho',
        on_delete=models.PROTECT,
        related_name='notas_fiscais',
        verbose_name='Centro de Trabalho',
    )
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    atualizado_em = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    class Meta:
        verbose_name = 'Nota Fiscal'
        verbose_name_plural = 'Notas Fiscais'
        unique_together = ('numero', 'serie', 'varejista', 'centro_de_trabalho')
        ordering = ['-criado_em']

    def __str__(self) -> str:
        return f'NF {self.numero}/{self.serie}'


class ItemNotaFiscal(models.Model):
    """
    Item de nota fiscal.

    `gera_saida` e `quantidade_restante` são determinados pelo CodigoCliente
    no momento da importação. `status` registra se o código foi encontrado.
    """

    STATUS_OK = 'OK'
    STATUS_NAO_CADASTRADO = 'NAO_CADASTRADO'
    STATUS_CHOICES = [
        (STATUS_OK, 'OK'),
        (STATUS_NAO_CADASTRADO, 'Não Cadastrado'),
    ]

    nota_fiscal = models.ForeignKey(
        'NotaFiscal',
        on_delete=models.CASCADE,
        related_name='itens',
        verbose_name='Nota Fiscal',
    )
    codigo_varejo = models.CharField(max_length=60, verbose_name='Código de Varejo')
    descricao = models.CharField(max_length=255, verbose_name='Descrição')
    ean = models.CharField(max_length=14, blank=True, verbose_name='EAN')
    ncm = models.CharField(max_length=8, blank=True, verbose_name='NCM')
    quantidade = models.IntegerField(verbose_name='Quantidade')
    valor_unitario = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name='Valor Unitário',
    )
    quantidade_restante = models.IntegerField(default=0, verbose_name='Quantidade Restante')
    gera_saida = models.BooleanField(default=False, verbose_name='Gera Saída')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_OK,
        verbose_name='Status',
    )

    class Meta:
        verbose_name = 'Item de Nota Fiscal'
        verbose_name_plural = 'Itens de Nota Fiscal'

    def __str__(self) -> str:
        return f'{self.codigo_varejo} — {self.descricao}'
