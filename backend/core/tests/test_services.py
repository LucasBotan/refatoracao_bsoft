"""
Testes do serviço de varejistas.

Cobertos:
  - normalizar_e_validar_cnpj: CNPJ válido com e sem máscara, inválido, todos iguais
  - listar_varejistas: sem filtro, com filtros nome/cidade/estado/id/cnpj,
    exclusão de inativos
  - obter_varejista: ativo retorna, inativo ou inexistente levanta NotFound
  - criar_varejista: criação, CNPJ duplicado, CNPJ inválido
  - atualizar_varejista: atualização, troca de CNPJ, CNPJ duplicado
  - inativar_varejista: soft delete
"""
from django.test import TestCase
from rest_framework.exceptions import NotFound, ValidationError

from core.models import Varejista
from core.services.varejista_service import (
    atualizar_varejista,
    criar_varejista,
    inativar_varejista,
    listar_varejistas,
    normalizar_e_validar_cnpj,
    obter_varejista,
)


class NormalizarValidarCnpjTest(TestCase):

    def test_cnpj_valido_com_mascara(self):
        resultado = normalizar_e_validar_cnpj('11.222.333/0001-81')
        self.assertEqual(resultado, '11.222.333/0001-81')

    def test_cnpj_valido_sem_mascara(self):
        resultado = normalizar_e_validar_cnpj('11222333000181')
        self.assertEqual(resultado, '11.222.333/0001-81')

    def test_cnpj_invalido_digito_verificador(self):
        with self.assertRaises(ValidationError) as ctx:
            normalizar_e_validar_cnpj('11.222.333/0001-00')
        self.assertIn('cnpj', ctx.exception.detail)

    def test_cnpj_todos_iguais(self):
        with self.assertRaises(ValidationError) as ctx:
            normalizar_e_validar_cnpj('00000000000000')
        self.assertIn('cnpj', ctx.exception.detail)

    def test_cnpj_curto_demais(self):
        with self.assertRaises(ValidationError) as ctx:
            normalizar_e_validar_cnpj('1234')
        self.assertIn('cnpj', ctx.exception.detail)

    def test_cnpj_com_espacos(self):
        # Espaços removidos antes da validação
        resultado = normalizar_e_validar_cnpj(' 11222333000181 ')
        self.assertEqual(resultado, '11.222.333/0001-81')


def _varejista(**kwargs) -> Varejista:
    defaults = {
        'nome': 'Distribuidora Teste',
        'cnpj': '11.222.333/0001-81',
        'ct': 'CT-001',
        'cidade': 'São Paulo',
        'estado': 'SP',
        'ativo': True,
    }
    return Varejista.objects.create(**{**defaults, **kwargs})


class ListarVarejistasTest(TestCase):

    def setUp(self):
        self.v1 = _varejista(nome='Alpha Ltda', cnpj='11.222.333/0001-81', cidade='São Paulo', estado='SP')
        self.v2 = _varejista(nome='Beta Ltda', cnpj='22.333.444/0001-08', cidade='Campinas', estado='SP')
        self.v3 = _varejista(nome='Gama SA', cnpj='33.444.555/0001-69', cidade='Belo Horizonte', estado='MG', ativo=False)

    def test_retorna_apenas_ativos(self):
        qs = listar_varejistas({})
        self.assertIn(self.v1, qs)
        self.assertIn(self.v2, qs)
        self.assertNotIn(self.v3, qs)

    def test_filtro_nome_parcial(self):
        qs = listar_varejistas({'nome': 'alpha'})
        self.assertIn(self.v1, qs)
        self.assertNotIn(self.v2, qs)

    def test_filtro_cidade(self):
        qs = listar_varejistas({'cidade': 'campinas'})
        self.assertIn(self.v2, qs)
        self.assertNotIn(self.v1, qs)

    def test_filtro_estado(self):
        qs = listar_varejistas({'estado': 'sp'})
        self.assertEqual(qs.count(), 2)

    def test_filtro_id(self):
        qs = listar_varejistas({'id': str(self.v1.pk)})
        self.assertEqual(list(qs), [self.v1])

    def test_filtro_cnpj_parcial(self):
        qs = listar_varejistas({'cnpj': '11.222'})
        self.assertIn(self.v1, qs)
        self.assertNotIn(self.v2, qs)


class ObterVarejistaTest(TestCase):

    def test_retorna_varejista_ativo(self):
        v = _varejista()
        resultado = obter_varejista(v.pk)
        self.assertEqual(resultado, v)

    def test_levanta_not_found_para_inativo(self):
        v = _varejista(ativo=False)
        with self.assertRaises(NotFound):
            obter_varejista(v.pk)

    def test_levanta_not_found_para_inexistente(self):
        with self.assertRaises(NotFound):
            obter_varejista(99999)


class CriarVarejistaTest(TestCase):

    def test_criacao_basica(self):
        dados = {'nome': 'Distribuidora Z', 'cnpj': '11222333000181', 'ct': 'CT-X'}
        v = criar_varejista(dados)
        self.assertEqual(v.nome, 'Distribuidora Z')
        self.assertEqual(v.cnpj, '11.222.333/0001-81')
        self.assertTrue(v.ativo)

    def test_cnpj_normalizado_na_criacao(self):
        dados = {'nome': 'Distribuidora Z', 'cnpj': '11222333000181', 'ct': 'CT-X'}
        v = criar_varejista(dados)
        self.assertEqual(v.cnpj, '11.222.333/0001-81')

    def test_cnpj_duplicado_levanta_erro(self):
        _varejista(cnpj='11.222.333/0001-81')
        with self.assertRaises(ValidationError) as ctx:
            criar_varejista({'nome': 'Outro', 'cnpj': '11222333000181', 'ct': 'CT-Y'})
        self.assertIn('cnpj', ctx.exception.detail)

    def test_cnpj_invalido_levanta_erro(self):
        with self.assertRaises(ValidationError):
            criar_varejista({'nome': 'Teste', 'cnpj': '00000000000000', 'ct': 'CT-Z'})


class AtualizarVarejistaTest(TestCase):

    def setUp(self):
        self.v = _varejista(cnpj='11.222.333/0001-81')

    def test_atualiza_campos(self):
        atualizar_varejista(self.v.pk, {
            'nome': 'Novo Nome',
            'cnpj': '11.222.333/0001-81',
            'ct': 'CT-002',
        })
        self.v.refresh_from_db()
        self.assertEqual(self.v.nome, 'Novo Nome')

    def test_troca_cnpj_valido(self):
        # 33445566000186 é um CNPJ matematicamente válido (DV1=8, DV2=6)
        atualizar_varejista(self.v.pk, {
            'nome': self.v.nome,
            'cnpj': '33445566000186',
            'ct': self.v.ct,
        })
        self.v.refresh_from_db()
        self.assertEqual(self.v.cnpj, '33.445.566/0001-86')

    def test_cnpj_duplicado_levanta_erro(self):
        outro = _varejista(nome='Outro', cnpj='22.333.444/0001-08')
        with self.assertRaises(ValidationError):
            atualizar_varejista(self.v.pk, {
                'nome': self.v.nome,
                'cnpj': outro.cnpj,
                'ct': self.v.ct,
            })


class InativarVarejistaTest(TestCase):

    def test_inativa_varejista(self):
        v = _varejista()
        inativar_varejista(v.pk)
        v.refresh_from_db()
        self.assertFalse(v.ativo)

    def test_registro_permanece_no_banco(self):
        v = _varejista()
        inativar_varejista(v.pk)
        self.assertEqual(Varejista.objects.filter(pk=v.pk).count(), 1)

    def test_inativar_inexistente_levanta_not_found(self):
        with self.assertRaises(NotFound):
            inativar_varejista(99999)
