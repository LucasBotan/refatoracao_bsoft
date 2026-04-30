"""
Serviço de Centro de Trabalho.

Encapsula o acesso ao banco e as regras de negócio relacionadas a CentroDeTrabalho.
Views nunca devem consultar diretamente o model — sempre via este serviço.
"""
from django.db.models import QuerySet
from rest_framework.exceptions import NotFound

from core.models import CentroDeTrabalho


def listar_centros() -> QuerySet:
    """Retorna todos os centros de trabalho ordenados por nome."""
    return CentroDeTrabalho.objects.all()


def obter_por_id(pk: int) -> CentroDeTrabalho:
    """
    Retorna o centro de trabalho com a PK informada.

    Raises:
        NotFound: se não existir registro com a PK fornecida.
    """
    try:
        return CentroDeTrabalho.objects.get(pk=pk)
    except CentroDeTrabalho.DoesNotExist:
        raise NotFound('Centro de trabalho não encontrado.')
