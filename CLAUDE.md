# CLAUDE.md

## Visao Geral

Este repositório representa um monorepo de refatoração de sistema legado com frontend e backend.
O objetivo principal do agente é preservar continuidade de negócio, reduzir risco de regressão e evoluir a base com mudanças pequenas, testáveis e alinhadas à arquitetura definida.

## Estrutura Esperada Do Monorepo

- `frontend/`: aplicação React.
- `backend/`: API Django REST Framework.
- `k8s/`: manifests Kubernetes e overlays por ambiente.
- `.gitlab-ci.yml`: pipeline corporativo GitLab CI.
- `otel/` ou configuração equivalente na raiz: OpenTelemetry e integrações de observabilidade.
- `.claude/rules/`: regras modulares usadas como fonte de verdade operacional.

## Stack Tecnologica

- Backend: Python com Django REST Framework.
- Frontend: React com Hooks, composição e Context API quando necessário.
- Banco de dados: PostgreSQL.
- Autenticação: Azure Active Directory via OAuth2/OpenID Connect.
- Infraestrutura: Kubernetes.
- CI/CD: GitLab CI.
- Observabilidade: OpenTelemetry, Prometheus, Loki, Tempo e Grafana conforme padrão corporativo.

## Prioridades Do Agente

1. Entender o comportamento atual antes de refatorar.
2. Favorecer mudanças incrementais, reversíveis e cobertas por testes.
3. Manter contratos de API estáveis ou explicitar versionamento quando houver ruptura.
4. Respeitar separação de responsabilidades entre frontend, backend e infraestrutura.
5. Preservar aderência aos padrões corporativos de segurança, deployment e observabilidade.

## Como Trabalhar Neste Projeto

- Leia primeiro as regras em `.claude/rules/`.
- Para mudanças backend, siga obrigatoriamente `architecture.md`, `code-style.md`, `testing.md`, `api-conventions.md`, `security.md` e `legacy-refactor.md`.
- Para mudanças frontend, siga obrigatoriamente `architecture.md`, `code-style.md`, `testing.md`, `security.md` e `legacy-refactor.md`.
- Para mudanças de infraestrutura, siga obrigatoriamente `devops.md`, `security.md` e `observability.md`.
- Em dúvidas, prefira a opção mais simples, explícita e testável.

## Regras De Execucao

- Nunca reescrever grandes áreas de código legado sem necessidade comprovada.
- Nunca misturar refatoração estrutural ampla com mudança funcional crítica no mesmo PR sem justificativa.
- Sempre documentar pressupostos, trade-offs e riscos quando tocar fluxos centrais.
- Sempre propor validação por testes automatizados ou checklist operacional.
- Sempre manter commits semânticos.

## Referencias Internas

- `.claude/rules/architecture.md`
- `.claude/rules/code-style.md`
- `.claude/rules/testing.md`
- `.claude/rules/api-conventions.md`
- `.claude/rules/devops.md`
- `.claude/rules/security.md`
- `.claude/rules/observability.md`
- `.claude/rules/legacy-refactor.md`
