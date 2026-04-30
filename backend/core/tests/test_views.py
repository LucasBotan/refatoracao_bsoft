"""
Testes das views de varejistas.

Cobertos:
  - GET /varejistas/      — paginação, filtros, 401 sem auth
  - POST /varejistas/     — criação, validação, CNPJ duplicado
  - GET /varejistas/{pk}/ — detalhe, 404 para inativo/inexistente
  - PUT /varejistas/{pk}/ — atualização completa
  - DELETE /varejistas/{pk}/ — soft delete, 204
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.models import Varejista

User = get_user_model()

CNPJ_VALIDO = '11222333000181'
CNPJ_VALIDO_FORMATADO = '11.222.333/0001-81'
# 33445566000186 é matematicamente válido (DV1=8, DV2=6)
CNPJ_VALIDO_2 = '33445566000186'
CNPJ_VALIDO_2_FORMATADO = '33.445.566/0001-86'


def _payload(**kwargs) -> dict:
    base = {
        'nome': 'Distribuidora Teste',
        'cnpj': CNPJ_VALIDO,
        'ct': 'CT-001',
    }
    return {**base, **kwargs}


def _varejista(**kwargs) -> Varejista:
    defaults = {
        'nome': 'Distribuidora Teste',
        'cnpj': CNPJ_VALIDO_FORMATADO,
        'ct': 'CT-001',
        'ativo': True,
    }
    return Varejista.objects.create(**{**defaults, **kwargs})


class BaseViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@fabricaos.com',
            password='senha-teste',
        )
        self.client.force_authenticate(user=self.user)


# ── GET /varejistas/ ─────────────────────────────────────────────────────────

class VarejistaListGetTest(BaseViewTest):

    def test_retorna_200(self):
        response = self.client.get('/varejistas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_401_sem_autenticacao(self):
        client = APIClient()
        response = client.get('/varejistas/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_lista_paginada(self):
        _varejista()
        response = self.client.get('/varejistas/')
        data = response.json()
        self.assertIn('results', data)
        self.assertIn('count', data)
        self.assertEqual(data['count'], 1)

    def test_nao_retorna_inativos(self):
        _varejista(ativo=False)
        response = self.client.get('/varejistas/')
        self.assertEqual(response.json()['count'], 0)

    def test_filtro_por_nome(self):
        _varejista(nome='Alpha Ltda', cnpj=CNPJ_VALIDO_FORMATADO)
        _varejista(nome='Beta Ltda', cnpj=CNPJ_VALIDO_2_FORMATADO)
        response = self.client.get('/varejistas/?nome=alpha')
        self.assertEqual(response.json()['count'], 1)
        self.assertEqual(response.json()['results'][0]['nome'], 'Alpha Ltda')

    def test_filtro_por_estado(self):
        _varejista(cnpj=CNPJ_VALIDO_FORMATADO, estado='SP')
        _varejista(cnpj=CNPJ_VALIDO_2_FORMATADO, estado='MG')
        response = self.client.get('/varejistas/?estado=SP')
        self.assertEqual(response.json()['count'], 1)


# ── POST /varejistas/ ────────────────────────────────────────────────────────

class VarejistaCreateTest(BaseViewTest):

    def test_criacao_retorna_201(self):
        response = self.client.post('/varejistas/', _payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cnpj_normalizado_na_resposta(self):
        response = self.client.post('/varejistas/', _payload(), format='json')
        self.assertEqual(response.json()['cnpj'], CNPJ_VALIDO_FORMATADO)

    def test_campos_obrigatorios_ausentes_retorna_400(self):
        response = self.client.post('/varejistas/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cnpj_invalido_retorna_400(self):
        payload = _payload(cnpj='00000000000000')
        response = self.client.post('/varejistas/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cnpj', response.json())

    def test_cnpj_duplicado_retorna_400(self):
        _varejista(cnpj=CNPJ_VALIDO_FORMATADO)
        response = self.client.post('/varejistas/', _payload(cnpj=CNPJ_VALIDO), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cnpj', response.json())

    def test_401_sem_autenticacao(self):
        response = APIClient().post('/varejistas/', _payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── GET /varejistas/{pk}/ ────────────────────────────────────────────────────

class VarejistaDetailGetTest(BaseViewTest):

    def test_retorna_200_para_ativo(self):
        v = _varejista()
        response = self.client.get(f'/varejistas/{v.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['id'], v.pk)

    def test_retorna_404_para_inativo(self):
        v = _varejista(ativo=False)
        response = self.client.get(f'/varejistas/{v.pk}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retorna_404_para_inexistente(self):
        response = self.client.get('/varejistas/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ── PUT /varejistas/{pk}/ ────────────────────────────────────────────────────

class VarejistaUpdateTest(BaseViewTest):

    def test_atualiza_e_retorna_200(self):
        v = _varejista()
        payload = _payload(nome='Nome Atualizado', cnpj=CNPJ_VALIDO)
        response = self.client.put(f'/varejistas/{v.pk}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['nome'], 'Nome Atualizado')

    def test_cnpj_duplicado_retorna_400(self):
        v1 = _varejista(cnpj=CNPJ_VALIDO_FORMATADO)
        v2 = _varejista(nome='Outro', cnpj=CNPJ_VALIDO_2_FORMATADO)
        payload = _payload(cnpj=v2.cnpj, nome=v1.nome)
        response = self.client.put(f'/varejistas/{v1.pk}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ── DELETE /varejistas/{pk}/ ─────────────────────────────────────────────────

class VarejistaDeleteTest(BaseViewTest):

    def test_inativa_e_retorna_204(self):
        v = _varejista()
        response = self.client.delete(f'/varejistas/{v.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        v.refresh_from_db()
        self.assertFalse(v.ativo)

    def test_registro_permanece_no_banco(self):
        v = _varejista()
        self.client.delete(f'/varejistas/{v.pk}/')
        self.assertTrue(Varejista.objects.filter(pk=v.pk).exists())

    def test_retorna_404_para_inexistente(self):
        response = self.client.delete('/varejistas/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
