# Security Rules

## Principios

- Segurança é requisito de arquitetura, não etapa posterior.
- Toda mudança deve considerar OWASP Top 10, proteção de dados e menor privilégio.
- Dados sensíveis exigem tratamento diferenciado em trânsito, repouso e logs.

## Aplicacao

- Validar e sanitizar toda entrada externa.
- Escapar saída quando aplicável no frontend.
- Nunca interpolar dados do usuário em queries, comandos ou templates sem proteção adequada.
- Aplicar autenticação e autorização explicitamente em cada fluxo.
- Usar permissões por papel, escopo ou política claramente definidas.

## Azure AD

- A autenticação corporativa deve usar Azure Active Directory com OAuth2/OpenID Connect.
- Tokens devem ser validados quanto a issuer, audience, expiração e escopos.
- Não persistir ou logar tokens completos.

## API E Rede

- Aplicar rate limiting nos endpoints sensíveis.
- Exigir TLS em todos os ambientes externos.
- Segregar tráfego interno e externo conforme necessidade do domínio.
- Definir CORS de forma explícita e restritiva.

## Kubernetes E Segredos

- Secrets nunca devem ser versionados em texto puro.
- Containers devem rodar com o menor privilégio possível.
- Evitar execução como root quando não houver necessidade técnica.
- Network Policies devem restringir comunicação lateral quando suportado.

## Compliance E Auditoria

- Considerar LGPD e demais requisitos regulatórios aplicáveis.
- Logs de auditoria devem registrar eventos relevantes sem expor segredos.
- Incidentes e exceções de segurança devem ser documentados e rastreáveis.
