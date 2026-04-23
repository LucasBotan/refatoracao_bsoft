# DevOps Rules

## Infraestrutura Base

- O projeto roda em Kubernetes.
- Os manifests ficam em `k8s/` na raiz.
- Recursos mínimos esperados: `Deployment`, `Service`, `Ingress`, `ConfigMap` e `Secret`.
- Todo container deve possuir requests e limits.
- Health checks de readiness e liveness são obrigatórios.

## Containers

- Preferir imagens base corporativas ou homologadas.
- Favorecer multi-stage builds.
- Produção deve usar imagens pequenas, seguras e sem dependências de build.
- Tags de imagem devem ser rastreáveis a commit, tag ou release semântica.

## GitLab CI

- O arquivo `.gitlab-ci.yml` na raiz é fonte de verdade do pipeline.
- Estágios devem cobrir validação, testes, build, scan de segurança e deploy.
- Cache e artefatos devem ser usados com parcimônia e previsibilidade.
- O pipeline deve falhar cedo em lint, testes e scanners essenciais.

## Ambientes

- Tratar `dev`, `qa` e `prd` como ambientes distintos, com configurações explícitas.
- Não codificar segredos no repositório.
- Configurações variáveis devem sair de código e ir para variáveis de ambiente, `ConfigMaps` ou `Secrets`.
- Mudanças de infraestrutura devem considerar rollback.

## IaC E Operacao

- Terraform é preferido para recursos cloud.
- Ansible é preferido para configuração on-premises.
- Toda alteração operacional relevante deve ser reproduzível.
- Definir políticas de rollout, rollback e observabilidade junto com o deployment.

## Microservicos E Monorepo

- Cada serviço deve ter responsabilidade única.
- Serviços devem ser stateless sempre que possível.
- Cada microserviço deve ter isolamento razoável de dados e build.
- Não introduzir dependências implícitas entre pipelines sem necessidade.
