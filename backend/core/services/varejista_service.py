"""
Serviço de varejistas.

Concentra regras de negócio: validação de CNPJ, unicidade, soft delete.
Views e serializers delegam operações de escrita a este módulo.
Nenhuma lógica HTTP reside aqui.
"""
import logging
import re

from django.db.models import QuerySet
from rest_framework.exceptions import NotFound, ValidationError

from ..models import Varejista

logger = logging.getLogger(__name__)


# ── Validação de CNPJ ────────────────────────────────────────────────────────

def _calcular_digito(digits: str, pesos: list[int]) -> int:
    """Calcula um dígito verificador do CNPJ pelo método padrão."""
    soma = sum(int(d) * p for d, p in zip(digits, pesos))
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def normalizar_e_validar_cnpj(cnpj: str) -> str:
    """
    Valida e normaliza o CNPJ.

    Aceita CNPJ com ou sem máscara. Retorna sempre no formato XX.XXX.XXX/XXXX-XX.
    Levanta ValidationError se o CNPJ for inválido.
    """
    digits = re.sub(r'\D', '', cnpj)

    if len(digits) != 14:
        raise ValidationError({'cnpj': 'CNPJ deve conter 14 dígitos.'})

    if len(set(digits)) == 1:
        raise ValidationError({'cnpj': 'CNPJ inválido.'})

    dv1 = _calcular_digito(digits[:12], [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    if int(digits[12]) != dv1:
        raise ValidationError({'cnpj': 'CNPJ inválido.'})

    dv2 = _calcular_digito(digits[:13], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    if int(digits[13]) != dv2:
        raise ValidationError({'cnpj': 'CNPJ inválido.'})

    return f'{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}'


# ── Operações de leitura ─────────────────────────────────────────────────────

def listar_varejistas(params: dict, ct_codigo: str | None = None) -> QuerySet:
    """
    Retorna QuerySet de varejistas ativos, sempre filtrado pelo CT quando fornecido.

    Filtros opcionais (query params):
        nome    — busca parcial case-insensitive
        cidade  — busca parcial case-insensitive
        estado  — correspondência exata case-insensitive
        id      — correspondência exata por PK
        cnpj    — busca parcial (aceita com ou sem máscara)

    O parâmetro `ct_codigo` é injetado pela view a partir de
    request.user.centro_trabalho.ct — nunca vem do frontend.
    """
    qs = Varejista.objects.filter(ativo=True)

    if ct_codigo is not None:
        qs = qs.filter(ct=ct_codigo)

    if nome := params.get('nome'):
        qs = qs.filter(nome__icontains=nome)

    if cidade := params.get('cidade'):
        qs = qs.filter(cidade__icontains=cidade)

    if estado := params.get('estado'):
        qs = qs.filter(estado__iexact=estado)

    if pk := params.get('id'):
        qs = qs.filter(pk=pk)

    if cnpj := params.get('cnpj'):
        qs = qs.filter(cnpj__icontains=cnpj)

    return qs


def obter_varejista(pk: int, ct_codigo: str | None = None) -> Varejista:
    """
    Retorna um varejista ativo pelo PK.

    Se `ct_codigo` for fornecido, valida que o varejista pertence ao CT.
    """
    filtros = {'pk': pk, 'ativo': True}
    if ct_codigo is not None:
        filtros['ct'] = ct_codigo
    try:
        return Varejista.objects.get(**filtros)
    except Varejista.DoesNotExist:
        raise NotFound({'detail': 'Varejista não encontrado.'})


# ── Operações de escrita ─────────────────────────────────────────────────────

def criar_varejista(dados: dict) -> Varejista:
    """
    Cria um novo varejista.

    Regras:
        - CNPJ é validado e normalizado antes da persistência.
        - CNPJ duplicado é rejeitado com 400.
    """
    cnpj_normalizado = normalizar_e_validar_cnpj(dados.get('cnpj', ''))

    if Varejista.objects.filter(cnpj=cnpj_normalizado).exists():
        raise ValidationError({'cnpj': 'CNPJ já cadastrado.'})

    dados = {**dados, 'cnpj': cnpj_normalizado}
    varejista = Varejista.objects.create(**dados)
    logger.info('Varejista criado: id=%d, nome="%s"', varejista.pk, varejista.nome)
    return varejista


def atualizar_varejista(pk: int, dados: dict) -> Varejista:
    """
    Atualiza um varejista existente (substituição total — PUT).

    Se `cnpj` estiver presente nos dados, é revalidado e normalizado.
    Unicidade é verificada excluindo o próprio registro.
    """
    varejista = obter_varejista(pk)

    if 'cnpj' in dados:
        cnpj_normalizado = normalizar_e_validar_cnpj(dados['cnpj'])
        if Varejista.objects.filter(cnpj=cnpj_normalizado).exclude(pk=pk).exists():
            raise ValidationError({'cnpj': 'CNPJ já cadastrado.'})
        dados = {**dados, 'cnpj': cnpj_normalizado}

    for campo, valor in dados.items():
        setattr(varejista, campo, valor)

    varejista.save()
    logger.info('Varejista atualizado: id=%d, nome="%s"', varejista.pk, varejista.nome)
    return varejista


def inativar_varejista(pk: int) -> None:
    """
    Soft delete: marca `ativo=False`.

    O registro permanece no banco para fins de auditoria e rastreabilidade.
    """
    varejista = obter_varejista(pk)
    varejista.ativo = False
    varejista.save(update_fields=['ativo', 'atualizado_em'])
    logger.info('Varejista inativado: id=%d, nome="%s"', varejista.pk, varejista.nome)
