# API Conventions

## Principios

- A API deve ser RESTful, previsível e orientada a recursos.
- Contratos devem ser explícitos, estáveis e documentados.
- Mudanças breaking devem ser evitadas; quando inevitáveis, precisam de estratégia de versionamento.

## Design

- Usar substantivos para recursos e verbos apenas quando a ação realmente for um comando.
- Manter consistência em nomes, filtros, paginação, ordenação e códigos de status.
- Validar entrada na borda da aplicação.
- Respostas de erro devem ser padronizadas e úteis para cliente e observabilidade.
- Idempotência deve ser considerada em endpoints sensíveis.

## Documentacao

- Toda API deve estar refletida em Swagger/OpenAPI.
- Exemplos de request e response devem ser mantidos para fluxos importantes.
- Campos obsoletos devem ser marcados como deprecated antes de remoção.

## Seguranca

- Todo endpoint deve ter autenticação e autorização explícitas, salvo exceções documentadas.
- Integrar autenticação com Azure AD via OAuth2/OpenID Connect.
- Nunca confiar em dados de cliente sem validação.
- Dados sensíveis não devem vazar em payloads, logs ou mensagens de erro.

## Boas Praticas DRF

- Viewsets e routers devem ser usados quando simplificarem consistência.
- Serializers devem representar contrato, não concentrar orquestração de domínio.
- Paginação deve ser obrigatória em coleções potencialmente grandes.
- Filtros devem ser explícitos e documentados.
