# Malha de ocupação para pessoas, trator e animais

## Intenção

Hoje as rotas dos trabalhadores e tratores são escritas à mão e os animais sorteiam destinos dentro de um retângulo. Nada impede uma pessoa de atravessar um galpão, um trator de passar por um canteiro, uma vaca de entrar no cocho ou sair pela cerca, nem alguém "regar" no meio da grama. Queremos que o próprio jogo saiba, em cada cena, onde cada um pode estar e onde cada animação faz sentido.

A malha é invisível para o jogador. Só o código (e os testes) a usam.

## Objetivos

- Uma malha de ocupação 2D (vista de cima) por cena: mapa de cada mundo e cena de missão de cada mundo.
- Regras de passagem por tipo de agente: pessoa, trator, animal (pássaros ficam de fora).
- Pontos de trabalho válidos por tarefa, derivados dos objetos do mundo (regar ao lado de canteiro/planta, alimentar ao lado do cocho, colher junto da escada/árvore, bancada à frente da bancada, carregar entre dois pontos de carga).
- Pessoas e tratores andam por caminhos calculados na malha (busca de caminho), não por rotas soltas.
- Animais escolhem destinos e trajetos só por células livres do próprio piquete.
- Testes garantem as regras em todos os mundos e em todos os tamanhos de grade de missão.

## Não-objetivos

- Mostrar a malha ao jogador.
- Evitar colisão entre atores em movimento (pessoa contra pessoa, pessoa contra animal). Cada agente respeita o cenário, não os outros agentes. Os animais continuam com o espaçamento entre si que já têm.
- Pássaros e borboletas.
- Mudar o desenho dos mundos.

## Anti-objetivos (seria falha mesmo funcionando)

- Animação de trabalho num lugar sem o objeto correspondente (regar grama, alimentar sem cocho).
- Qualquer agente atravessando construção, cerca, água, cocho, árvore, canteiro, a grade da missão ou um hexágono de missão da trilha (a estrada continua passável; os hexágonos são contornados).
- Resultado diferente a cada visita (tudo continua determinístico pela semente).
- Queda perceptível de desempenho: a malha é calculada uma vez ao montar a cena, nunca por quadro.

## Como funciona

### Malha

- Retângulo que cobre o chão da cena, células de 0,25 unidade (decisão minha; ajustável).
- Cada célula guarda o que a ocupa, em ordem de prioridade: grade da missão, marcador de missão (o hexágono de cada ponto da trilha no mapa, raio ~0,8), água, cerca, construção/objeto, cocho/comida, árvore, plantio (canteiro, pé de milho, planta), estrada, livre.
- Formas reais: cada tipo de objeto ganha uma pegada retangular (largura × profundidade) girada pela rotação dele, em vez do raio usado hoje; cercas são segmentos com espessura; água e manchas usam o polígono; árvores e pés de milho usam círculo.
- A ocupação é rasterizada a partir dos dados do `World` já montado; os landscapes não mudam o que colocam.

### Quem passa onde

| Agente | Pode | Não pode |
|---|---|---|
| Pessoa | livre, estrada, corredores entre fileiras de canteiros e borda de talhões | construção, objeto, cerca, água, cocho, árvore, canteiro, pé de milho, grade da missão, hexágono de missão |
| Trator | estrada e livre com folga do tamanho dele (raio ~0,8) | tudo o que a pessoa não pode, mais corredores estreitos |
| Animal | células livres dentro do próprio piquete, com folga da cerca | cocho, água, abrigo, cerca, fora do piquete |

O cálculo de "folga" usa a malha dilatada pelo raio do agente.

Pessoas entram e saem dos piquetes só pela abertura da porteira (a cerca tem um vão); assim o tratador chega ao cocho andando, sem atravessar a cerca. Animais não passam pela porteira.

### Pontos de trabalho

Gerados a partir dos objetos e checados na malha (a célula do pé tem de ser passável para pessoa):

- regar / capinar: célula livre adjacente a canteiro ou planta, de frente para ela;
- colher: ao lado da escada do pomar, de frente para a árvore;
- alimentar: ao lado do cocho, do lado de dentro do piquete, de frente para o cocho;
- bancada / triagem / painel: à frente do objeto, de frente para ele;
- carregar: par de pontos de carga (pilha de feno, caixas, pallets) ligados por caminho.

### Atores

- Cada ator deixa de ter rota fixa e passa a ter um trabalho: tarefa + área (ex.: "regar a horta principal") ou alvo (ex.: "esta bancada").
- Na montagem da cena o jogo escolhe, pela semente, uma sequência de pontos de trabalho válidos e liga cada par pela busca de caminho (A*) na malha da pessoa ou do trator; o resultado é uma rota em polilinha suavizada que o movimento atual (`actorPose`) já sabe seguir.
- Se não houver ponto válido, o ator não é criado (melhor ausente do que errado).

### Animais

- A área do animal passa a ser a lista de células livres do piquete na malha do animal.
- `nextTarget` sorteia só entre essas células e só aceita trajetos cuja linha não cruze célula proibida.

### Verificação

- Testes por mundo, para mapa e todos os tamanhos de grade de missão: toda rota de pessoa/trator só cruza células passáveis para ela; todo ponto de trabalho tem o objeto certo ao lado; todo animal começa e anda só em células livres do piquete.
- Ferramenta de desenvolvimento (fora do jogo, não publicada) que desenha a malha e as rotas por cima da cena, para conferência visual.

## Restrições

- TypeScript, sem comentários, nomes em inglês.
- Determinístico; calculado uma vez por cena.
- Teto de chamadas de desenho inalterado (a malha não desenha nada no jogo).

## Decisões minhas (para conferir)

- Células de 0,25.
- Pessoas andam nos corredores entre fileiras de canteiros e na borda dos talhões, nunca por dentro do milho.
- Atores não desviam uns dos outros.
- Ator sem ponto válido não aparece.

## Deixado para quem construir

- Valores exatos das pegadas de cada objeto.
- Como suavizar a rota que sai do A*.
- Quantos pontos de trabalho cada ator visita por ciclo.
