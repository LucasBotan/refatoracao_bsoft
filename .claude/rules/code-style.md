# Code Style Rules

## Principios

- Código deve ser legível antes de ser engenhoso.
- Nomes devem revelar intenção.
- Funções e métodos devem ser curtos e focados.
- Comentários devem explicar contexto ou decisão, não repetir o código.
- Complexidade ciclomática deve permanecer baixa.

## Python E Django REST Framework

- Seguir PEP8 e convenções idiomáticas da comunidade Python.
- Usar type hints em código novo e em áreas refatoradas.
- Preferir funções puras e serviços explícitos para regras de negócio.
- Evitar métodos muito longos em views, serializers, models e services.
- Model methods devem representar comportamento natural da entidade, não concentrar fluxos transacionais complexos.
- Queries devem ser explícitas, eficientes e revisadas quanto a `select_related`, `prefetch_related` e paginação.
- Exceptions devem ser específicas e tratadas no boundary adequado.
- Evitar signals para regras críticas de negócio quando houver fluxo explícito melhor.

## React

- Usar componentes funcionais e Hooks.
- Priorizar clareza de fluxo de dados e previsibilidade de estado.
- Extrair hooks customizados quando houver lógica reutilizável ou muito ruído no componente.
- Evitar efeitos colaterais desnecessários em `useEffect`.
- Context API deve carregar apenas estado realmente compartilhado.
- Preferir composição de componentes a componentes excessivamente configuráveis.
- Manter arquivos, componentes e hooks pequenos o suficiente para leitura rápida.

## Formatação E Ferramentas

- Python: formatar com ferramenta oficial adotada pelo time e validar com linter.
- Frontend: ESLint e Prettier são obrigatórios.
- Não desabilitar regras de lint sem justificativa objetiva.
- Não introduzir novas ferramentas de formatação sem alinhamento do time.

## Convenções De Escrita

- Evitar abreviações obscuras.
- Evitar nomes genéricos como `data`, `handler`, `util`, `temp` e `misc`.
- Preferir nomes que expressem ação ou significado de domínio.
- Valores mágicos devem virar constantes nomeadas.
- Condicionais complexas devem ser extraídas para funções ou objetos com nome semântico.

## Legado

- Ao tocar código legado, melhorar legibilidade local sem alterar comportamento indevidamente.
- Corrigir nome ruim, extração óbvia e complexidade excessiva no escopo da mudança quando o risco for baixo.
- Não fazer refatoração ornamental.
