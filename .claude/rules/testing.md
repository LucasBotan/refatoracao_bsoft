# Testing Rules

## Objetivo

Garantir segurança de mudança durante a refatoração do legado por meio de feedback rápido e cobertura orientada a risco.

## Estrategia

- Seguir a pirâmide de testes.
- Priorizar testes unitários para regras de negócio.
- Usar testes de integração para contratos entre camadas e integrações relevantes.
- Usar testes de sistema ou end-to-end para fluxos críticos de negócio.
- Em áreas legadas frágeis, capturar comportamento atual com characterization tests antes de refatorar.

## Backend

- Testar services, regras de domínio, serializers críticos, permissões e contratos de API.
- Cobrir cenários felizes, falhas esperadas e regras de autorização.
- Testes de banco devem ser objetivos e validar comportamento observável.
- Evitar testes excessivamente acoplados à implementação interna.

## Frontend

- Testar comportamento percebido pelo usuário.
- Cobrir renderização condicional, estados de loading, erro, sucesso e autorização.
- Testar hooks customizados quando encapsularem regra relevante.
- Evitar snapshots sem valor claro.

## Contratos E Qualidade

- APIs novas ou alteradas devem ter testes de contrato e documentação OpenAPI atualizada.
- Bugs corrigidos devem ganhar teste de regressão.
- Refatorações relevantes devem preservar ou ampliar cobertura na área tocada.
- Não confiar apenas em testes manuais para mudanças com impacto funcional.

## Cobertura

- Cobertura global é métrica auxiliar, não objetivo isolado.
- Áreas críticas devem ter cobertura acima da média do sistema.
- Se uma área não puder ser testada de forma ideal, registrar risco e propor mitigação.

## Ferramentas

- Backend: pytest ou stack equivalente adotada pelo projeto.
- Frontend: React Testing Library e framework de testes JavaScript adotado pelo projeto.
- Qualidade estática: linters, type checking e scanners de segurança devem rodar no pipeline.
