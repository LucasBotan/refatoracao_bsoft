# /fix-issue

Use este comando para corrigir um problema de forma segura e incremental.

## Fluxo

1. Reproduzir ou entender claramente o problema.
2. Identificar escopo real e possíveis efeitos colaterais.
3. Aplicar a menor mudança capaz de corrigir a causa raiz.
4. Adicionar ou ajustar testes de regressão.
5. Validar impacto em segurança, API, observabilidade e deploy.

## Regras

- Não mascarar sintomas sem tratar a causa quando a causa estiver ao alcance.
- Não ampliar escopo sem necessidade.
- Explicitar hipóteses quando a reprodução não for determinística.
