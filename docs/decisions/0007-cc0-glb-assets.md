# 0007 — Assets CC0 em GLB com fallback procedural

**Contexto:** os modelos procedurais ficaram abaixo da qualidade desejada.

**Decisão:** usar pacotes CC0 (Kenney, Quaternius), convertidos e otimizados em tempo de desenvolvimento por `scripts/assets/`, versionados em `public/models/` com manifesto validado (Zod) e orçamento de 5 MB. Cada modelo tem fallback procedural via error boundary.

**Consequências:** qualidade visual muito maior, funcionamento offline, licença livre inclusive comercial; o download dos pacotes é manual quando a rede bloqueia os sites de origem.

**Status:** aceita. Manifesto, componente `Model` e fallback já estão no código; a conversão (Task 5.2) aguarda o download manual dos pacotes.
