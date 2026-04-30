"""
xml_parser_service — Parser de XML de NF-e brasileira (padrão SEFAZ).

Extrai dados do cabeçalho e itens a partir do XML de nfeProc.
Lança ValueError('XML_INVALIDO') para qualquer falha de estrutura ou tipo.
"""
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

_NF_NAMESPACE = 'http://www.portalfiscal.inf.br/nfe'


def _detectar_nsm(root: ET.Element) -> dict:
    tag = root.tag
    if tag.startswith('{'):
        ns_uri = tag[1:tag.index('}')]
        return {'nfe': ns_uri}
    return {'nfe': _NF_NAMESPACE}


def _text(element: ET.Element, xpath: str, nsm: dict) -> str:
    el = element.find(xpath, nsm)
    return el.text.strip() if el is not None and el.text else ''


def _decimal(s: str) -> Decimal:
    try:
        return Decimal(s.strip())
    except InvalidOperation:
        raise ValueError('XML_INVALIDO')


def _parse_datetime(s: str) -> datetime:
    """Converte string ISO (com ou sem timezone) em datetime aware."""
    if not s:
        raise ValueError('XML_INVALIDO')
    try:
        if 'T' in s:
            # fromisoformat suporta +HH:MM no Python 3.7+; 'Z' precisa ser substituído.
            return datetime.fromisoformat(s.replace('Z', '+00:00'))
        return datetime.strptime(s, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        raise ValueError('XML_INVALIDO')


def parse_xml(conteudo: bytes) -> tuple[dict, list[dict]]:
    """
    Parseia o XML de NF-e e retorna (dados_nota, lista_de_itens).

    dados_nota: dict com numero, serie, chave_acesso, protocolo, data_emissao, valor_total
    lista_de_itens: list[dict] com codigo_varejo, descricao, ean, ncm, quantidade, valor_unitario

    Levanta ValueError('XML_INVALIDO') para XML malformado ou campos obrigatórios ausentes.
    """
    try:
        root = ET.fromstring(conteudo)
    except ET.ParseError:
        raise ValueError('XML_INVALIDO')

    nsm = _detectar_nsm(root)

    inf_nfe = root.find('.//nfe:infNFe', nsm)
    if inf_nfe is None:
        raise ValueError('XML_INVALIDO')

    id_attr = inf_nfe.get('Id', '')
    chave_acesso = id_attr[3:] if id_attr.startswith('NFe') else id_attr

    ide = inf_nfe.find('nfe:ide', nsm)
    if ide is None:
        raise ValueError('XML_INVALIDO')

    numero = _text(ide, 'nfe:nNF', nsm)
    serie = _text(ide, 'nfe:serie', nsm)

    if not numero or not serie:
        raise ValueError('XML_INVALIDO')

    data_str = _text(ide, 'nfe:dhEmi', nsm) or _text(ide, 'nfe:dEmi', nsm)
    data_emissao = _parse_datetime(data_str)

    vNF_el = inf_nfe.find('.//nfe:ICMSTot/nfe:vNF', nsm)
    if vNF_el is None or not vNF_el.text:
        raise ValueError('XML_INVALIDO')
    valor_total = _decimal(vNF_el.text)

    prot_el = root.find('.//nfe:protNFe/nfe:infProt/nfe:nProt', nsm)
    protocolo = prot_el.text.strip() if prot_el is not None and prot_el.text else ''

    dados_nota = {
        'numero': numero,
        'serie': serie,
        'chave_acesso': chave_acesso,
        'protocolo': protocolo,
        'data_emissao': data_emissao,
        'valor_total': valor_total,
    }

    itens: list[dict] = []
    for det in inf_nfe.findall('nfe:det', nsm):
        prod = det.find('nfe:prod', nsm)
        if prod is None:
            continue

        ean = _text(prod, 'nfe:cEAN', nsm)
        if ean.upper() == 'SEM GTIN':
            ean = ''

        qcom_str = _text(prod, 'nfe:qCom', nsm) or '0'
        vun_str = _text(prod, 'nfe:vUnCom', nsm) or '0'

        itens.append({
            'codigo_varejo': _text(prod, 'nfe:cProd', nsm),
            'descricao': _text(prod, 'nfe:xProd', nsm),
            'ean': ean,
            'ncm': _text(prod, 'nfe:NCM', nsm),
            'quantidade': int(_decimal(qcom_str)),
            'valor_unitario': _decimal(vun_str),
        })

    return dados_nota, itens
