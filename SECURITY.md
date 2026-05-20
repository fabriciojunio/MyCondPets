# Política de Segurança

## Reportar uma Vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança, **NÃO** abra uma issue pública.

Envie um e-mail para: junioad555@gmail.com

Inclua:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial

Responderemos em até 72 horas.

## Medidas de Segurança Implementadas

- Autenticação OAuth via Google (sem senhas armazenadas)
- Rate limiting em endpoints sensíveis
- Sanitização de inputs
- CSP Headers
- HTTPS obrigatório em produção
- API Keys com escopo limitado
