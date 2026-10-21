# 0014 — Mundos refeitos a partir dos prompts e vida nos cenários

**Contexto:** os mundos ainda pareciam blocos retangulares soltos em grama vazia, com cinturão de borda uniforme, trilhas em arco ou espiral e nenhum movimento além de bichos e pássaros. Os prompts de arte de cada mundo (Horta, Milharal, Pomar, Estufa, Celeiro, Fazenda Completa) pedem um lugar único e conectado, com distritos funcionais, transições de chão, vegetação em grupos e vida.

**Decisão:**
- Cada mundo é montado por `stage.ts` (`stageMap`/`stageFarm`) com distritos escritos à mão: canteiros alinhados (`plots.ts`), bosquetes de frutas, talhões de milho em estágios diferentes, estufas, piquetes com porteira, pátios de serviço.
- O chão ganha manchas irregulares (`World.stains`: terra batida, musgo, palha, cascalho), canais e lagos; a borda vira bosques em grupos (`natureKit.ts`), mais ralos nos lados da câmera e fora dos blocos.
- As trilhas são desenhadas à mão em `worldTrails.ts` e a estrada é suavizada; acabaram o arco e a espiral.
- Objetos novos continuam sendo geometria low-poly em código e instanciada (`features/*Objects.ts`), inclusive oitões em prisma para os telhados não atravessarem paredes.
- Cada camada do chão tem altura própria (manchas escalonadas, água acima das manchas, cada estrada um pouco acima da anterior) e lotes vizinhos usam polygon offset, para não cintilar.
- Vida: `World.actors` lista trabalhadores e tratores com rota e tarefa. `actorMotion.ts` dá a pose em função do tempo (determinística) e `Actors.tsx` desenha pessoas e tratores por parte do corpo instanciada, com pernas, braços, ferramentas e rodas animados. O mapa também mostra o rebanho.

**Consequências:**
- O contrato `landscapeContract.ts` passou a exigir árvores agrupadas na borda e atores fora da grade da missão.
- Teto de chamadas de desenho mantido (310 no mapa, 390 na missão); hoje os mapas ficam entre 124 e 225 e as missões entre 140 e 187.
- Mudar uma trilha exige rever os distritos daquele mundo, como antes.
