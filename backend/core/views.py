"""
Views do app core.

Responsabilidade exclusiva: controle de fluxo HTTP.
  - Extrair parâmetros do request.
  - Chamar serializer para validação de contrato.
  - Delegar lógica de negócio ao serviço correspondente.
  - Retornar Response com código de status adequado.

O CT é sempre obtido de request.user.centro_trabalho — nunca do frontend.
"""
import logging

from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .serializers import (
    CentroDeTrabalhoSerializer,
    CodigoClienteInputSerializer,
    CodigoClienteSerializer,
    ConsolidarInputSerializer,
    ImportarXMLInputSerializer,
    ImportarXMLResponseSerializer,
    NotaFiscalSerializer,
    SalvarNotaInputSerializer,
    ValidarItensInputSerializer,
    VarejistaSerializer,
)
from .services import (
    centro_trabalho_service,
    codigo_cliente_service,
    nota_fiscal_service,
    varejista_service,
)

logger = logging.getLogger(__name__)

_PAGE_SIZE = 20


def _ct_obrigatorio(request):
    """Retorna o CT do usuário ou levanta PermissionDenied."""
    ct = request.user.centro_trabalho
    if ct is None:
        raise PermissionDenied('Usuário sem centro de trabalho definido.')
    return ct


# ── Varejistas ────────────────────────────────────────────────────────────────

class VarejistaListView(APIView):
    """
    GET  /varejistas/  → lista paginada filtrada pelo CT do usuário autenticado
    POST /varejistas/  → cria varejista (ct vem do body — campo livre de cadastro)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ct = _ct_obrigatorio(request)
        qs = varejista_service.listar_varejistas(request.query_params, ct_codigo=ct.ct)

        paginator = PageNumberPagination()
        paginator.page_size = _PAGE_SIZE
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(VarejistaSerializer(page, many=True).data)

    def post(self, request):
        serializer = VarejistaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        varejista = varejista_service.criar_varejista(serializer.validated_data)
        return Response(VarejistaSerializer(varejista).data, status=status.HTTP_201_CREATED)


class VarejistaDetailView(APIView):
    """
    GET    /varejistas/{pk}/  → detalha (valida CT)
    PUT    /varejistas/{pk}/  → atualização completa
    DELETE /varejistas/{pk}/  → inativação (soft delete)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        ct = _ct_obrigatorio(request)
        varejista = varejista_service.obter_varejista(pk, ct_codigo=ct.ct)
        return Response(VarejistaSerializer(varejista).data)

    def put(self, request, pk: int):
        ct = _ct_obrigatorio(request)
        varejista = varejista_service.obter_varejista(pk, ct_codigo=ct.ct)
        serializer = VarejistaSerializer(varejista, data=request.data)
        serializer.is_valid(raise_exception=True)
        varejista = varejista_service.atualizar_varejista(pk, serializer.validated_data)
        return Response(VarejistaSerializer(varejista).data)

    def delete(self, request, pk: int):
        ct = _ct_obrigatorio(request)
        varejista_service.obter_varejista(pk, ct_codigo=ct.ct)  # valida CT antes de inativar
        varejista_service.inativar_varejista(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Centros de Trabalho ───────────────────────────────────────────────────────

class CentroDeTrabalhoListView(APIView):
    """GET /centros-trabalho/ → lista todos (usado no seletor de primeiro acesso)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = centro_trabalho_service.listar_centros()
        return Response(CentroDeTrabalhoSerializer(qs, many=True).data)


# ── Nota Fiscal — importação via XML ─────────────────────────────────────────

class ImportarXMLView(APIView):
    """
    POST /notas/importar-xml/

    Parseia o XML de NF-e, valida varejista e itens.
    Retorna preview completo sem persistir nada.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ct = _ct_obrigatorio(request)

        serializer = ImportarXMLInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        conteudo = serializer.validated_data['xml'].encode('utf-8')
        varejista_id = serializer.validated_data['varejista_id']

        resultado = nota_fiscal_service.importar_xml(conteudo, varejista_id, ct)
        return Response(ImportarXMLResponseSerializer(resultado).data)


class ValidarItensView(APIView):
    """
    POST /notas/validar/

    Re-processa itens via CodigoCliente sem re-parsear o XML.
    Usado após o cadastro de códigos faltantes.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ct = _ct_obrigatorio(request)

        serializer = ValidarItensInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resultado = nota_fiscal_service.validar_itens(
            itens_raw=serializer.validated_data['itens'],
            varejista_id=serializer.validated_data['varejista_id'],
            ct=ct,
        )
        return Response(resultado)


class ConsolidarView(APIView):
    """
    POST /notas/consolidar/

    Aplica as regras de consolidação: auxiliares incorporados ao principal.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        _ct_obrigatorio(request)  # garante que o usuário tem CT

        serializer = ConsolidarInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resultado = nota_fiscal_service.consolidar(serializer.validated_data['itens'])
        return Response(resultado)


class SalvarNotaView(APIView):
    """
    POST /notas/salvar/

    Persiste a nota fiscal após re-validação server-side completa.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ct = _ct_obrigatorio(request)

        serializer = SalvarNotaInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nota = nota_fiscal_service.salvar_nota(
            dados_nota=serializer.validated_data['nota'],
            itens_raw=serializer.validated_data['itens'],
            varejista_id=serializer.validated_data['varejista_id'],
            ct=ct,
        )
        return Response(NotaFiscalSerializer(nota).data, status=status.HTTP_201_CREATED)


# ── Código de Cliente ─────────────────────────────────────────────────────────

class CodigoClienteView(APIView):
    """POST /codigo-cliente/ → cria um novo CodigoCliente no CT do usuário."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ct = _ct_obrigatorio(request)

        serializer = CodigoClienteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        codigo_cliente = codigo_cliente_service.criar_codigo_cliente(
            serializer.validated_data, ct
        )
        return Response(CodigoClienteSerializer(codigo_cliente).data, status=status.HTTP_201_CREATED)


class CodigoClienteDetailView(APIView):
    """PUT /codigo-cliente/{pk}/ → atualiza CodigoCliente do CT do usuário."""

    permission_classes = [IsAuthenticated]

    def put(self, request, pk: int):
        ct = _ct_obrigatorio(request)

        serializer = CodigoClienteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        codigo_cliente = codigo_cliente_service.atualizar_codigo_cliente(
            pk, serializer.validated_data, ct
        )
        return Response(CodigoClienteSerializer(codigo_cliente).data)
