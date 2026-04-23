# Legacy Refactor Rules

## Mentalidade

- Primeiro entender, depois mover.
- Refatorar para facilitar mudança segura, não para buscar perfeição abstrata.
- Respeitar o conhecimento embutido no sistema legado, ainda que a implementação seja ruim.

## Abordagem

- Antes de alterar uma área sensível, identificar comportamento atual, dependências e pontos de risco.
- Criar characterization tests quando a regra existir mas não estiver clara.
- Isolar costuras antes de substituir componentes críticos.
- Preferir padrão strangler para migrações graduais quando aplicável.
- Quebrar refatorações grandes em etapas pequenas e reversíveis.

## O Que Fazer

- Melhorar nomes, extrações, duplicações e fronteiras quando isso reduzir risco futuro.
- Introduzir adapters para encapsular integrações legadas.
- Reduzir acoplamento antes de mover responsabilidades.
- Registrar dívida técnica descoberta e impacto no negócio.

## O Que Evitar

- Big bang rewrite.
- Alterar comportamento sem evidência de necessidade.
- Misturar modernização estética com mudança de regra crítica.
- Substituir tecnologia apenas por preferência.

## Criterios De Aceite

- Comportamento crítico preservado ou explicitamente alterado com validação.
- Testes cobrindo o que foi tocado.
- Riscos conhecidos documentados.
- Caminho de rollback compreensível.
