# 0007 — Assets CC0 em GLB com fallback procedural

**Contexto:** os modelos procedurais ficaram abaixo da qualidade desejada.

**Decisão:** usar pacotes CC0 (Kenney, Quaternius), convertidos e otimizados em tempo de desenvolvimento por `scripts/assets/`, versionados em `public/models/` com manifesto validado (Zod) e orçamento de 5 MB. Cada modelo tem fallback procedural via error boundary.

**Consequências:** qualidade visual muito maior, funcionamento offline, licença livre inclusive comercial; o download dos pacotes é manual quando a rede bloqueia os sites de origem.

**Status:** aceita e implementada; escala por altura-alvo medida na conversão e orçamento ampliado para 10 MB (ver 0008).

Robô, plantas do canteiro e cercas deixaram de usar GLB (ver 0009).
