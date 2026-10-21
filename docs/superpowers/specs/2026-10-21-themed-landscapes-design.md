# Paisagens temáticas dos mundos — design

Data: 2026-10-21

## Intenção

Os mapas dos mundos ainda parecem um amontoado de objetos jogados na tela. E o cenário da missão (onde o robô trabalha) é sempre a mesma fazenda base — casa, celeiro, lago e pasto nos mesmos lugares — só com a cor do chão, a plantação e alguns enfeites trocados. O usuário quer que cada mundo seja **um lugar de verdade**: um milharal parece uma fazenda de milho, um pomar parece um pomar, e o cenário da missão é **literalmente um mapa novo** com a temática do mundo, não o mapa base disfarçado.

## Referências que guiam o visual

Pesquisa feita em 2026-10-21 (jogos e fotos aéreas de fazendas reais). Pontos aprovados pelo usuário:

1. **Poucos blocos grandes, cada um de um tipo só** — campo com campo, pomar num canto, cada animal no seu cercado (guias de layout do FarmVille 3; peças de Dorfromantik e Islanders).
2. **Um marco por mundo**, reconhecível de longe — silos de grão no Milharal, galpão de frutas no Pomar, bloco de estufas na Estufa, celeiro grande no Celeiro.
3. **Espaço vazio de propósito** — grama lisa entre blocos, para o olho descansar e a trilha aparecer (Corn & Commerce: platô limpo, rio de um lado, estradas de terra).
4. **Bordas limpas** — cerca, sebe ou fileira de árvores separando os blocos.
5. **A missão acontece dentro da paisagem do mundo**, com objetos novos onde faltar: silo, secador, galpão de frutas, estufas em série, piquetes. Tudo low-poly.

Fotos aéreas reais por tema:
- Milharal: campo enorme e contínuo; na beira da estrada, grupo de silos metálicos com celeiro e galpões.
- Pomar: fileiras retas, quadras separadas por caminhos, galpão de embalagem com caixas empilhadas.
- Estufa: estufas coladas lado a lado formando um bloco; galpão de apoio; área de carga; caixa d'água.
- Celeiro: celeiros ligados, piquetes quase quadrados, galpão de ração, cochos.

## Objetivos

- Os 6 mapas da tela de missões são paisagens compostas: cada um tem um marco, 2 a 4 blocos grandes temáticos, grama livre entre eles e floresta só como cinturão na borda.
- Cada mundo tem um **cenário de missão próprio**, montado do zero em volta do grid de canteiros, com a mesma linguagem do mapa daquele mundo (mesmo marco, mesmos tipos de bloco), para o aluno reconhecer o lugar ao entrar na missão.
- Objetos novos, low-poly, construídos em código como os de `WorldFeatures.tsx`, onde os modelos atuais não cobrem o tema.
- Desempenho: nenhum mundo pode pesar como o Milharal pesava antes. Objetos repetidos são desenhados por instância (como o milho já é).

## Por mundo (marco e blocos)

| Mundo | Marco | Blocos do mapa e da missão | Objetos novos |
|---|---|---|---|
| Horta | galpão de ferramentas com regadores | canteiros elevados em grade, composteira, cerca baixa de madeira, galinheiro | galpão de ferramentas, composteira, regador |
| Milharal | grupo de 3 silos metálicos + secador | campo de milho contínuo em fileiras, estrada de terra, carroça com espigas, espantalho, fardos | silo metálico (bin), secador de grãos, carroça, espantalho |
| Pomar | galpão de embalagem com caixas | quadras de árvores em fileiras retas separadas por caminhos, pilhas de caixas, escada encostada | galpão de embalagem, pilha de caixas, escada |
| Estufa | bloco de estufas geminadas | estufas lado a lado em série, galpão de apoio, caixa d'água, canteiros de mudas | estufa geminada (módulo repetível), galpão de apoio |
| Celeiro | celeiro grande ligado a galpão | piquetes quadrados com animais, cochos, galpão de ração, fardos empilhados | galpão de ração, pilha de fardos |
| Fazenda completa | casa da fazenda com caixa d'água | um bloco de cada mundo anterior, menores, em volta da casa | casa da fazenda (se o modelo atual não servir) |

## Estilo próprio de cada mundo

Pedido do usuário: **cada mundo tem seu estilo**. Não basta trocar os objetos; o lugar inteiro tem outra cara: cor, forma do terreno, borda, caminho, luz e o que se mexe. O mesmo estilo vale no mapa e no cenário da missão daquele mundo.

| Mundo | Cores e luz | Terreno | Borda do mapa | Caminho | Movimento ambiente |
|---|---|---|---|---|---|
| Horta | verde vivo, luz de manhã clara | plano, canteiros marrons bem marcados | sebe baixa e flores | terra batida estreita | borboletas, galinhas ciscando |
| Milharal | dourado e palha, luz de fim de tarde quente | ondulado suave, campo cobre quase tudo | fileira de árvores quebra-vento | estrada de terra larga com sulcos | milho balançando, pássaros sobre o campo |
| Pomar | verde fundo com frutas vermelhas e laranja, luz suave | encosta em degraus leves | muro de pedra baixo | caminhos de grama entre quadras | folhas e frutas balançando |
| Estufa | verde-água e branco, luz fria e limpa | plano e organizado, quase geométrico | cerca de tela e caixa d'água | piso de cascalho claro | brilho no vidro, aspersores |
| Celeiro | ocre e vermelho de celeiro, luz morna | plano com piquetes de grama mais verde | cerca de madeira alta | terra com marcas de roda | animais andando, cata-vento girando |
| Fazenda completa | paleta mista equilibrada, luz de meio-dia | mistura dos terrenos em áreas separadas | mistura de sebe, pedra e madeira | caminhos ligando cada área | um pouco de cada |

## Restrições

- Low-poly sempre, cores chapadas, sem texturas. Sem baixar modelos de terceiros: objetos novos são geometria em código.
- O grid de canteiros da missão não muda: as 60 missões continuam iguais (tamanho, células, objetivos). Só muda o que está em volta.
- A trilha de cada mundo no mapa (já aprovada) não muda de forma; os blocos se arranjam em volta dela e nunca a cruzam. Caminho não passa por lago sem ponte nem por plantação (regra já existente).
- Sem comentários no código; nomes em inglês.
- Modo "gráficos leves" continua existindo e deixa a cena ainda mais leve.

## Fora do escopo

- Tela inicial e cena de celebração.
- Treinamento: continua com a fazenda atual (não pertence a nenhum mundo).
- Missões, provas, blocos de programação e painel do professor.

## O que seria um fracasso mesmo funcionando

- Trocar um amontoado por outro: objetos espalhados aleatoriamente pelo mapa, sem blocos.
- Cenário de missão que ainda mostra a casa, o lago e o pasto de sempre em todos os mundos.
- Mapa bonito que trava em computador de escola.
- Algo cobrindo o grid de canteiros ou atrapalhando a câmera da missão.

## Decisões minhas (o usuário pode trocar)

- **Composição feita à mão, não sorteada.** Cada mundo vira uma "planta" com os blocos em posições definidas; o sorteio só varia detalhes pequenos (rotação, tamanho, qual árvore). É o que tira a cara de amontoado.
- **Enfeites miúdos (grama, flores, pedrinhas) só nas bordas** dos blocos e dos caminhos, em quantidade bem menor que hoje (hoje são até ~460 por cena).
- **Floresta só como cinturão** na borda do mapa, nunca no meio.
- **Animais só onde fazem sentido**: Celeiro e Fazenda completa têm pasto com bichos; Horta tem galinhas; os outros não têm pasto.
- **Teto de desempenho**: medir o número de chamadas de desenho por cena e manter cada mundo no máximo no nível que a Horta tem hoje.
- **Ordem de entrega**: primeiro o **Milharal completo** (mapa + cenário de missão) como piloto para o usuário aprovar o estilo; depois os outros cinco no mesmo molde.

## O que fica para quem constrói

- Medidas exatas, cores e proporções dos objetos novos, dentro da paleta de cada mundo.
- Como organizar o código das plantas (um arquivo por mundo é o esperado).
- Posição exata dos blocos, respeitando trilha, grid e câmera.
