"""
codigo_cliente_service — CRUD de CodigoCliente escopado ao CT do usuário.
"""
from rest_framework.exceptions import NotFound, ValidationError

from ..models import CodigoCliente, Varejista


def _obter_varejista(varejista_id: int, ct) -> Varejista:
    try:
        return Varejista.objects.get(pk=varejista_id, ct=ct.ct, ativo=True)
    except Varejista.DoesNotExist:
        raise NotFound('Varejista não encontrado ou não pertence ao seu centro de trabalho.')


def criar_codigo_cliente(dados: dict, ct) -> CodigoCliente:
    varejista = _obter_varejista(dados['varejista_id'], ct)

    if CodigoCliente.objects.filter(
        codigo=dados['codigo'],
        varejista=varejista,
        centro_de_trabalho=ct,
    ).exists():
        raise ValidationError({'codigo': 'Código já cadastrado para este varejista e CT.'})

    return CodigoCliente.objects.create(
        codigo=dados['codigo'],
        varejista=varejista,
        centro_de_trabalho=ct,
        necessita_saida=dados.get('necessita_saida', True),
    )


def atualizar_codigo_cliente(pk: int, dados: dict, ct) -> CodigoCliente:
    try:
        codigo_cliente = CodigoCliente.objects.get(pk=pk, centro_de_trabalho=ct)
    except CodigoCliente.DoesNotExist:
        raise NotFound('Código de cliente não encontrado.')

    varejista = _obter_varejista(dados['varejista_id'], ct)

    if CodigoCliente.objects.filter(
        codigo=dados['codigo'],
        varejista=varejista,
        centro_de_trabalho=ct,
    ).exclude(pk=pk).exists():
        raise ValidationError({'codigo': 'Código já cadastrado para este varejista e CT.'})

    codigo_cliente.codigo = dados['codigo']
    codigo_cliente.varejista = varejista
    codigo_cliente.necessita_saida = dados.get('necessita_saida', True)
    codigo_cliente.save()
    return codigo_cliente
