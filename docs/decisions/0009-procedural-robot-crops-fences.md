# 0009 — Robô, tomateiro e cercas procedurais

**Contexto:** o robô do Quaternius não lembrava o robô da referência e só tinha 4 animações; o tomate era fino e não mostrava quando estava pronto; a cerca esticada parecia errada.

**Decisão:** desenhar robô, tomateiro e cercas em código. As animações do robô são poses calculadas por `poseAt(clip, tempo)`, e o clip é escolhido por `clipForStep` a partir dos eventos do passo. O tomateiro vem de `cropShape(estágio)` com três estágios; as cercas vêm de `fencePieces` e são desenhadas com instancing.

**Consequências:** visual fiel à referência, 10 animações testáveis sem WebGL, menos megabytes de modelos; ajustes de forma passam a ser alterações de código.
