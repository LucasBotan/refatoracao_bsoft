"""
nota_fiscal_service — Orquestra o fluxo completo de importação de NF-e.

Fluxo:
  importar_xml  → parse + valida varejista + processa itens → retorna preview
  validar_itens → re-processa itens após cadastro de CodigosCliente
  consolidar    → aplica regras de auxiliar → principal
  salvar_nota   → re-valida tudo + persiste em transaction.atomic

O CT nunca é lido do request — recebido como instância de CentroDeTrabalho.
"""
import logging

from django.db import transaction
from rest_framework.exceptions import ValidationError

from ..models import CentroDeTrabalho, ItemNotaFiscal, NotaFiscal, Varejista
from . import consolidacao_service, validacao_service, xml_parser_service

logger = logging.getLogger(__name__)


def importar_xml(conteudo_xml: bytes, varejista_id: int, ct: CentroDeTrabalho) -> dict:
    """
    Parseia o XML, valida varejista e itens. Não persiste nada.

    Retorna:
        nota: dados do cabeçalho + varejista_id
        itens: lista com status, gera_saida e quantidade_restante preenchidos
        pode_concluir: True apenas se todos os itens têm status=OK
    """
    try:
        dados_nota, itens_raw = xml_parser_service.parse_xml(conteudo_xml)
    except ValueError:
        raise ValidationError({'_form': 'XML_INVALIDO'})

    varejista = validacao_service.validar_varejista(varejista_id, ct)
    _verificar_duplicidade(dados_nota['numero'], dados_nota['serie'], varejista, ct)

    itens = validacao_service.processar_itens(itens_raw, varejista, ct)
    pode_concluir = all(i['status'] == 'OK' for i in itens)

    return {
        'nota': {**dados_nota, 'varejista_id': varejista.pk},
        'itens': itens,
        'pode_concluir': pode_concluir,
    }


def validar_itens(itens_raw: list[dict], varejista_id: int, ct: CentroDeTrabalho) -> dict:
    """Re-processa itens sem re-parsear o XML (usado após cadastro de CodigosCliente)."""
    varejista = validacao_service.validar_varejista(varejista_id, ct)
    itens = validacao_service.processar_itens(itens_raw, varejista, ct)
    return {
        'itens': itens,
        'pode_concluir': all(i['status'] == 'OK' for i in itens),
    }


def consolidar(itens: list[dict]) -> dict:
    """Aplica regras de consolidação (auxiliares → principal)."""
    return {'itens': consolidacao_service.consolidar_itens(itens)}


@transaction.atomic
def salvar_nota(dados_nota: dict, itens_raw: list[dict], varejista_id: int, ct: CentroDeTrabalho) -> NotaFiscal:
    """
    Persiste a nota fiscal e seus itens.

    Re-valida varejista, duplicidade e CodigosCliente no servidor — não confia
    em status/gera_saida vindos do frontend.
    """
    varejista = validacao_service.validar_varejista(varejista_id, ct)
    _verificar_duplicidade(dados_nota['numero'], dados_nota['serie'], varejista, ct)

    itens = validacao_service.processar_itens(itens_raw, varejista, ct)

    nao_cadastrados = [i for i in itens if i['status'] == 'NAO_CADASTRADO']
    if nao_cadastrados:
        raise ValidationError({'_form': 'CODIGO_NAO_CADASTRADO'})

    itens_consolidados = consolidacao_service.consolidar_itens(itens)

    nota = NotaFiscal.objects.create(
        numero=dados_nota['numero'],
        serie=dados_nota['serie'],
        chave_acesso=dados_nota.get('chave_acesso', ''),
        protocolo=dados_nota.get('protocolo', ''),
        data_emissao=dados_nota['data_emissao'],
        valor_total=dados_nota['valor_total'],
        observacao=dados_nota.get('observacao', ''),
        varejista=varejista,
        centro_de_trabalho=ct,
    )

    ItemNotaFiscal.objects.bulk_create([
        ItemNotaFiscal(
            nota_fiscal=nota,
            codigo_varejo=item['codigo_varejo'],
            descricao=item['descricao'],
            ean=item.get('ean', ''),
            ncm=item.get('ncm', ''),
            quantidade=item['quantidade'],
            valor_unitario=item['valor_unitario'],
            quantidade_restante=item['quantidade_restante'],
            gera_saida=item['gera_saida'],
            status=item['status'],
        )
        for item in itens_consolidados
    ])

    logger.info(
        'Nota fiscal salva: id=%d, numero=%s, serie=%s, varejista_id=%d, ct=%s',
        nota.pk, nota.numero, nota.serie, varejista.pk, ct.ct,
    )
    return nota


def _verificar_duplicidade(numero: str, serie: str, varejista: Varejista, ct: CentroDeTrabalho) -> None:
    if NotaFiscal.objects.filter(
        numero=numero,
        serie=serie,
        varejista=varejista,
        centro_de_trabalho=ct,
    ).exists():
        raise ValidationError({'_form': 'NF_DUPLICADA'})
