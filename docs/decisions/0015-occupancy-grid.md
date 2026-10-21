# 0015 — Malha de ocupação para pessoas, trator e animais

**Contexto:** as rotas dos trabalhadores e tratores eram escritas à mão e os animais sorteavam destinos dentro de um retângulo. Nada impedia alguém de atravessar um galpão, um trator de passar por canteiros ou pelos hexágonos de missão, um animal de entrar no cocho, sair pela cerca ou atravessar outro animal, nem uma animação de regar no meio da grama.

**Decisão:**
- Cada cena gera, uma vez, uma malha invisível de células de 0,25 (`navigation/buildOccupancy.ts`) a partir do mundo já montado: estrada, água, cerca, construção, cocho, árvore, plantio, hexágono de missão e a grade da missão com folga de 1,2. Cada objeto usa sua pegada real, girada (`navigation/shapes.ts`).
- Máscaras por agente (`navigation/passability.ts`): pessoa e trator andam só no livre e na estrada, com folga de 0,2 e 0,8; animal só no livre, com folga de 0,35. Pessoas entram nos piquetes pelo vão da porteira.
- Pontos de trabalho (`navigation/workSpots.ts`) saem dos objetos: regar e capinar ao lado de canteiros e plantas, colher na escada ou no ninho, alimentar no cocho ou no porta-feno, bancadas e painéis à frente deles, carregar entre pilhas de carga.
- Os mundos pedem trabalhos (`Job`) em vez de rotas; `navigation/planActors.ts` escolhe pontos válidos pela semente e liga-os por A* (`navigation/findPath.ts`). Trabalho sem ponto ou sem caminho não gera ator.
- Animais recebem as células livres do próprio piquete (`navigation/placeHerd.ts`), nascem sem sobrepor outro animal e só aceitam passeios que fiquem nessas células e longe dos outros animais, pelo tamanho de cada espécie (`nextWalkTarget`).
- `dev/occupancy.html` desenha a malha, as rotas e as células dos animais em `npm run dev`; não vai para o build.

**Consequências:**
- O contrato de cada mundo confere, no mapa e em todos os tamanhos de missão, em gráficos cheios e leves: rotas só por células abertas, trabalho só ao lado do objeto certo, animais em células livres e separados.
- A malha não desenha nada no jogo; as chamadas de desenho não mudaram (mapas 125–227, missões 142–182).
- Mudar o desenho de um mundo pode fazer um ator sumir quando o trabalho dele deixa de caber; o contrato acusa quando sobram menos de 3 trabalhadores no mapa ou 2 atores na missão.
