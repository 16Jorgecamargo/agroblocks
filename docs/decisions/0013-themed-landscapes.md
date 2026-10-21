# 0013 — Paisagens temáticas por mundo

**Contexto:** os mapas dos mundos pareciam um amontoado de objetos espalhados ao acaso, com floresta e mato pelo meio. O cenário da missão era a mesma fazenda base em todos os mundos (casa, celeiro, rio, pasto), só com outra cor de chão e alguns enfeites. O Milharal também pesava: cada pé de milho tinha cerca de 15 peças desenhadas separadamente.

**Decisão:**
- Cada mundo tem um estilo próprio em `src/render/world/worldStyles.ts`: cores, céu, luz do sol, relevo (plano, ondulado, em degraus) e tipo de borda (sebe, quebra-vento, muro de pedra, tela, cerca de madeira, misto). As duas cenas do mundo usam esse estilo.
- Cada mundo tem uma planta feita à mão em `src/render/world/landscapes/<mundo>Landscape.ts`, com o mapa da tela de missões e o cenário da missão. A planta põe poucos blocos grandes de um tipo só, um marco reconhecível, grama livre entre os blocos, borda no perímetro e enfeites pequenos só nas bordas dos blocos. O sorteio só varia detalhes.
- O kit (`landscapeKit.ts`) e os montadores (`scaffold.ts`) cuidam de trilha, borda, morros, enfeites e árvores em volta da fazenda da missão.
- Objetos novos são geometria low-poly em código, em `features/<mundo>Objects.ts`. Todos os objetos dos mundos são desenhados por instância (`InstancedFeatures.tsx`): uma chamada de desenho por tipo, não por objeto.
- O treinamento continua com a fazenda antiga (`farmLayout.ts`).

**Consequências:**
- Um mundo novo precisa de um estilo e de uma planta, e passa pelo contrato de testes `landscapeContract.ts`. O contrato confere: marco presente, plantação dentro dos blocos, trilha e canteiros livres, nada alto na frente da câmera, nada da fazenda base e mesmo resultado a cada visita.
- O peso de cada cena é medido em `tests/e2e/landscapePerf.spec.ts` pelo atributo `data-draw-calls` do canvas, com teto de 310 no mapa e 390 na missão (a Horta antiga). Hoje os mapas ficam entre 54 e 102 e as missões entre 117 e 163.
- Posições escritas à mão dependem da trilha de cada mundo: mudar uma trilha exige rever a planta do mapa daquele mundo.
