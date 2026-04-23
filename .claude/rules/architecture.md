# Architecture Rules

## Objetivo

Definir como o agente deve estruturar soluções neste monorepo de legado em refatoração, preservando baixo acoplamento, previsibilidade e capacidade de evolução.

## Diretrizes Gerais

- Aplicar SOLID de forma pragmática.
- Aplicar DRY sem sacrificar clareza.
- Aplicar KISS como critério default.
- Aplicar YAGNI evitando antecipar abstrações não demandadas.
- Preferir composição a herança, exceto quando o framework exigir convenções específicas.
- Manter fronteiras explícitas entre domínio, aplicação, infraestrutura e interface.

## Backend

- Organizar o backend por contextos de negócio sempre que possível.
- Separar claramente camadas de API, aplicação, domínio e infraestrutura.
- Views e viewsets do DRF devem ser finos; regras de negócio devem ficar fora da camada HTTP.
- Serializers não devem concentrar regras de negócio complexas.
- Acesso ao banco deve ser encapsulado em serviços, selectors, repositories ou padrão equivalente do time.
- Side effects externos devem ser isolados atrás de gateways/adapters.
- Dependências entre módulos devem apontar para dentro da regra de negócio, não para frameworks.

## Frontend

- Componentes devem ter responsabilidade única.
- Separar componentes de apresentação de componentes com lógica de orquestração quando houver ganho real de clareza.
- Hooks customizados devem encapsular estado compartilhado, integração com APIs e regras reutilizáveis de UI.
- Context API deve ser usada com parcimônia para estado transversal e estável.
- Evitar prop drilling profundo quando composição, contextos locais ou hooks resolverem melhor.
- Manter serviços de API desacoplados da camada visual.

## Monorepo

- Cada app deve poder ser entendido e validado isoladamente.
- Bibliotecas compartilhadas devem existir apenas quando houver uso recorrente e contrato estável.
- Evitar dependências cruzadas acidentais entre frontend e backend fora de contratos explícitos.
- Contratos compartilhados devem ser versionados e documentados.

## Padrões Recomendados

- Strategy para regras variantes.
- Factory para criação de objetos complexos ou integrações.
- Adapter para encapsular legado e integrações externas.
- Facade para simplificar acesso a subsistemas complexos.
- Null Object, Value Object e Specification quando ajudarem a reduzir condicionais e ruído.

## Antipadroes A Evitar

- God classes, God hooks ou serializers inchados.
- Lógica de domínio dispersa em views, signals, middleware ou componentes visuais.
- Acoplamento direto a detalhes de framework em regras centrais.
- Duplicação de regras entre frontend e backend sem contrato deliberado.

## Decisoes Arquiteturais

- Mudanças estruturais relevantes devem gerar ADR.
- Toda ADR deve registrar contexto, decisão, alternativas avaliadas e consequências.
- Refatorações maiores devem ser quebradas em passos pequenos, reversíveis e testáveis.
