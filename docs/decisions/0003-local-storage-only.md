# 0003 — Persistência apenas em LocalStorage

**Contexto:** sem backend, sem cadastro e sem transmissão de dados de estudantes.

**Decisão:** progresso (`agroblocks:v1`) e configurações (`agroblocks:settings:v1`) ficam no LocalStorage, versionados e validados com Zod. Dado inválido é copiado para `agroblocks:corrupt` e o jogo recomeça limpo. A pesquisa usa exportação CSV por máquina.

**Consequências:** privacidade por padrão e funcionamento offline; em contrapartida, um navegador por aluno e risco de perda se o navegador for limpo antes da exportação.
