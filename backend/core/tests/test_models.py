"""
Testes do model Varejista.

Cobertos:
  - Criação básica com campos obrigatórios
  - Unicidade de CNPJ
  - Soft delete via campo ativo
  - Ordenação padrão por nome
"""
from django.db import IntegrityError
from django.test import TestCase

from core.models import Varejista


class VarejistaModelTest(TestCase):

    def _criar(self, **kwargs) -> Varejista:
        defaults = {
            'nome': 'Distribuidora Teste',
            'cnpj': '11.222.333/0001-81',
            'ct': 'CT-001',
        }
        return Varejista.objects.create(**{**defaults, **kwargs})

    def test_criacao_com_campos_obrigatorios(self):
        v = self._criar()
        self.assertEqual(v.nome, 'Distribuidora Teste')
        self.assertEqual(v.cnpj, '11.222.333/0001-81')
        self.assertEqual(v.ct, 'CT-001')
        self.assertTrue(v.ativo)
        self.assertIsNotNone(v.criado_em)
        self.assertIsNotNone(v.atualizado_em)

    def test_str_retorna_nome_e_cnpj(self):
        v = self._criar()
        self.assertIn('Distribuidora Teste', str(v))
        self.assertIn('11.222.333/0001-81', str(v))

    def test_cnpj_unico(self):
        self._criar(nome='A')
        with self.assertRaises(IntegrityError):
            self._criar(nome='B')  # mesmo CNPJ

    def test_ativo_padrao_true(self):
        v = self._criar()
        self.assertTrue(v.ativo)

    def test_soft_delete(self):
        v = self._criar()
        v.ativo = False
        v.save()
        self.assertFalse(Varejista.objects.get(pk=v.pk).ativo)
        # Registro permanece no banco
        self.assertEqual(Varejista.objects.filter(pk=v.pk).count(), 1)

    def test_campos_opcionais_em_branco(self):
        v = self._criar(
            consumidor='',
            telefone='',
            email='',
            cep='',
            endereco='',
            numero='',
            bairro='',
            complemento='',
            cidade='',
            estado='',
        )
        self.assertEqual(v.email, '')
        self.assertEqual(v.estado, '')

    def test_ordenacao_padrao_por_nome(self):
        self._criar(nome='Zebra Ltda', cnpj='11.222.333/0001-81')
        self._criar(nome='Alpha Ltda', cnpj='22.333.444/0001-08')
        nomes = list(Varejista.objects.values_list('nome', flat=True))
        self.assertEqual(nomes, sorted(nomes))
