"""
consolidacao_service — Consolidação de itens de nota fiscal.

Regras:
- Itens auxiliares: gera_saida=False e status=OK.
- Item principal: o último item com gera_saida=True e status=OK.
- O valor total dos auxiliares é distribuído no valor unitário do principal.
- Se existirem auxiliares mas nenhum principal → ITEM_SEM_PRINCIPAL.
"""
from decimal import Decimal

from rest_framework.exceptions import ValidationError


def consolidar_itens(itens: list[dict]) -> list[dict]:
    """
    Retorna nova lista com o valor dos auxiliares incorporado ao principal.

    Não modifica a lista original.
    """
    itens = [dict(i) for i in itens]

    principais = [i for i in itens if i.get('gera_saida') and i['status'] == 'OK']
    auxiliares = [i for i in itens if not i.get('gera_saida') and i['status'] == 'OK']

    if auxiliares and not principais:
        raise ValidationError({'_form': 'ITEM_SEM_PRINCIPAL'})

    if auxiliares and principais:
        principal = principais[-1]
        valor_aux = sum(
            Decimal(str(a['valor_unitario'])) * int(a['quantidade'])
            for a in auxiliares
        )
        qtd = int(principal['quantidade'])
        if qtd > 0:
            total_principal = Decimal(str(principal['valor_unitario'])) * qtd
            principal['valor_unitario'] = (
                (total_principal + valor_aux) / qtd
            ).quantize(Decimal('0.0001'))

    return itens
