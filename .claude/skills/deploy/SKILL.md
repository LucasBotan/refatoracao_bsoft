# Deploy Skill

## Quando Usar

Use esta skill ao trabalhar com pipelines, manifests Kubernetes, Dockerfiles, rollout e rollback.

## Objetivos

- Garantir deploy reproduzível.
- Validar aderência a `k8s/`, `.gitlab-ci.yml` e regras de observabilidade e segurança.
- Confirmar readiness, liveness, resources, configuração e estratégia de release.

## Checklist

- Verificar manifests de `Deployment`, `Service`, `Ingress`, `ConfigMap` e `Secret`.
- Verificar requests e limits.
- Verificar readiness e liveness probes.
- Verificar versionamento de imagem e estratégia de rollout.
- Verificar variáveis por ambiente e ausência de segredos hardcoded.
- Verificar integração com telemetria.
