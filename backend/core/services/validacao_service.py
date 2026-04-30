"""
validacao_service — Validação de varejista e processamento de itens via CodigoCliente.

Todas as operações são escopadas ao CT do usuário (recebido como instância de
CentroDeTrabalho). Nenhum dado de CT é lido do request.
"""
from rest_framework.exceptions import NotFound

from ..models import CodigoCliente, Varejista

STATUS_OK = 'OK'
STATUS_NAO_CADASTRADO = 'NAO_CADASTRADO'


def validar_varejista(varejista_id: int, ct) -> Varejista:
    """
    Verifica que o varejista existe, está ativo e pertence ao CT do usuário.

    Levanta NotFound se não encontrado ou CT divergente.
    """
    try:
        return Varejista.objects.get(pk=varejista_id, ct=ct.ct, ativo=True)
    except Varejista.DoesNotExist:
        raise NotFound('Varejista não encontrado ou não pertence ao seu centro de trabalho.')


def processar_itens(itens_raw: list[dict], varejista: Varejista, ct) -> list[dict]:
    """
    Aplica lookup de CodigoCliente a cada item e retorna lista enriquecida.

    Regras por item:
    - CodigoCliente não encontrado → status=NAO_CADASTRADO, gera_saida=False, qtd_restante=0
    - necessita_saida=False → gera_saida=False, quantidade_restante=0
    - necessita_saida=True  → gera_saida=True,  quantidade_restante=quantidade
    """
    resultado: list[dict] = []

    for item in itens_raw:
        codigo_cliente = CodigoCliente.objects.filter(
            codigo=item['codigo_varejo'],
            varejista=varejista,
            centro_de_trabalho=ct,
        ).first()

        if codigo_cliente is None:
            resultado.append({
                **item,
                'status': STATUS_NAO_CADASTRADO,
                'gera_saida': False,
                'quantidade_restante': 0,
            })
        elif codigo_cliente.necessita_saida:
            resultado.append({
                **item,
                'status': STATUS_OK,
                'gera_saida': True,
                'quantidade_restante': item['quantidade'],
            })
        else:
            resultado.append({
                **item,
                'status': STATUS_OK,
                'gera_saida': False,
                'quantidade_restante': 0,
            })

    return resultado
