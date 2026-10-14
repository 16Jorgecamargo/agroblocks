# 0002 — Cena Three.js procedural low-poly

**Contexto:** a referência visual pede uma fazenda 3D isométrica; o jogo roda em computadores escolares e deve funcionar offline.

**Decisão:** todos os modelos (canteiros, plantas, robô, árvores, cercas, celeiro, moinho, silo) são geometrias primitivas com sombreamento facetado, criadas em código com React Three Fiber. Decoração é gerada de forma determinística por missão.

**Consequências:** zero assets externos, bundle menor, animações simples por escala/posição. Modo "gráficos leves" e fallback 2D cobrem máquinas fracas ou sem WebGL. Texturas PBR (ex.: Ubisoft CHORD) foram descartadas pela licença research-only e pelo custo de GPU.
