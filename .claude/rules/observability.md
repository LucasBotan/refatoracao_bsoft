# Observability Rules

## Objetivo

Garantir visibilidade operacional suficiente para diagnosticar regressões, gargalos e falhas em um contexto de refatoração de legado.

## Padrao

- OpenTelemetry é o padrão de instrumentação.
- Métricas, logs e traces devem ser correlacionáveis.
- Observabilidade deve nascer junto com o serviço, não depois do incidente.

## Metricas

- Expor métricas RED para serviços HTTP.
- Expor métricas USE para componentes de infraestrutura relevantes.
- Incluir métricas de negócio quando houver impacto operacional ou financeiro.
- Dashboards devem evidenciar taxa, erro, latência, saturação e capacidade.

## Logs

- Logs devem ser estruturados em JSON quando possível.
- Cada log deve conter contexto suficiente para investigação.
- Trace IDs e correlation IDs devem aparecer nos logs.
- Nunca registrar segredos, tokens, senhas ou dados pessoais desnecessários.

## Tracing

- Instrumentar chamadas HTTP, banco, filas e integrações relevantes.
- Amostragem deve equilibrar custo e capacidade de diagnóstico.
- Traces devem permitir seguir o fluxo entre frontend, backend e dependências externas quando aplicável.

## Alertas

- Alertas devem refletir impacto real ao usuário ou degradação operacional relevante.
- Priorizar alertas para erro elevado, latência degradada, indisponibilidade e saturação.
- Evitar alertas ruidosos sem ação clara.
