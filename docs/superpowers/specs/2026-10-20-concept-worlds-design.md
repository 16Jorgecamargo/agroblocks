# Mundos de conceitos — design

Data: 2026-10-20

## Intenção

Hoje o AgroBlocks tem um treinamento e 6 fases, uma por conceito de programação, e uma prova geral antes e depois. Uma missão por conceito é pouco para o aluno praticar de verdade, e uma prova única mistura todos os conceitos. A mudança transforma cada conceito num **mundo** com **10 missões** e com **prova própria antes e depois**: o aluno pratica o mesmo conceito em dificuldade crescente, mostra o que aprendeu e só então passa ao próximo mundo. Cada mundo é uma fazenda diferente, com cenário próprio, para que o avanço seja visível e motivador, e o professor vê o ganho de cada conceito separadamente.

## Objetivos

- 6 mundos × 10 missões = 60 missões, além do treinamento (que continua sendo uma missão única).
- Cada mundo tem pré-teste antes da primeira missão e pós-teste depois da décima, com 10 perguntas cada, só sobre o conceito do mundo.
- Cada mundo é uma fazenda 3D low-poly própria, com trilha de missões própria.
- O aluno escolhe o mundo na tela de missões, navegando entre fazendas.
- O próximo mundo só abre quando as 10 missões e o pós-teste do atual estão concluídos.
- A missão em si também usa o cenário do mundo dela.

## Fora do escopo

- Mudar o motor de execução ou a linguagem de blocos, ou criar blocos novos. As 60 missões usam os blocos que já existem.
- Duração das aulas: não é restrição (decisão do usuário).
- Versão para celular (o jogo é só desktop).

## O que seria um fracasso mesmo funcionando

- Missões repetidas com outro número: dentro de um mundo, cada missão precisa trazer algo novo (mapa, obstáculo, limite, combinação).
- Mundos que parecem a mesma fazenda com outra cor.
- Provas que só pedem para reconhecer o nome do bloco, sem ler, prever ou consertar programas.
- O painel do professor ficar ilegível com 61 missões.

## Estrutura

| Ordem | Mundo | Conceito (`MissionConcept`) | Cenário |
|---|---|---|---|
| — | Treinamento | `interface` | como hoje |
| 1 | Horta | `sequencing` | canteiros de hortaliças |
| 2 | Milharal | `repetition` | fileiras de milho |
| 3 | Pomar | `conditionals` | árvores frutíferas |
| 4 | Estufa | `sensors` | estufa de vidro com mudas |
| 5 | Celeiro | `variables` | celeiro, silo, estoque |
| 6 | Fazenda completa | `efficiency` | mistura de todos os anteriores |

Os nomes dos mundos são os da tabela.

### Ritmo das 10 missões (igual em todo mundo)

| Missões | Papel | Como é |
|---|---|---|
| 1–3 | Conhecer | Mapa pequeno, bloco novo em destaque. A missão 1 começa com parte do programa montado (`initialProgram`) e o aluno completa. |
| 4–6 | Praticar | O conceito com variações (fileiras maiores, curvas, obstáculos), usando também os blocos dos mundos anteriores. |
| 7–8 | Apertar | Limites: número máximo de blocos, pouca água/energia, objetivos em mais etapas. |
| 9 | Consertar | O programa já vem pronto com um erro; o aluno encontra e corrige. |
| 10 | Desafio final | Missão maior que junta tudo do mundo. |

Exemplo acordado para o Milharal: 1 andar 5 casas com repita · 2 plantar uma fileira · 3 regar uma fileira · 4 duas fileiras com curva · 5 fileira com pedras regulares · 6 repita com várias ações dentro · 7 fileira de 8 com no máximo 4 blocos · 8 pouca energia · 9 número de repetições errado para consertar · 10 repita dentro de repita num canteiro 3×3.

Os blocos de mundos anteriores continuam disponíveis nos mundos seguintes.

## Fluxo do aluno e desbloqueio

1. Cadastro (nome e escola) → treinamento (missão única, como hoje).
2. Para cada mundo, em ordem: **pré-teste do mundo** → missões 1 a 10, uma por vez → **pós-teste do mundo**.
3. O mundo seguinte abre quando o pós-teste do anterior é concluído.

- A prova geral antes do treinamento deixa de existir (decisão do usuário). O redirecionamento atual "aluno cadastrado sem pré-teste vai para a prova antes de jogar" passa a valer por mundo: ao tentar abrir uma missão de um mundo sem o pré-teste dele, o aluno vai para o pré-teste daquele mundo. O treinamento não exige prova.
- Mundos concluídos podem ser revisitados; refazer missões não pede a prova de novo.
- Não há turma em andamento: os dados de teste do servidor foram apagados em 2026-10-20. Não é preciso preservar o progresso salvo das 6 fases atuais. As fases atuais podem ser adaptadas ou reaproveitadas como missões dos mundos dos seus conceitos, à escolha do construtor. Saves antigos no navegador devem carregar sem erro (sem serem marcados como corrompidos), mesmo que o progresso antigo não tenha correspondência exata.

## Provas por mundo

- 6 pré-testes e 6 pós-testes, 10 perguntas cada (120 perguntas), escritas pelo construtor.
- Só o conceito do mundo, cobrindo reconhecer, ler/prever o resultado de um programa e achar/consertar erro naquele conceito.
- Cada pergunta do pós-teste é par de uma do pré-teste (mesmo tipo e dificuldade, cenário diferente), como o `pairId` atual, para medir ganho sem memorização.
- Formato atual mantido: uma pergunta por vez, múltipla escolha, sem mostrar acerto durante a prova, sem nota, sem tempo, sem botão de pular.
- Ao terminar o pós-teste, o aluno vê a comparação pré × pós daquele mundo (como a tabela de comparação atual) e segue para o próximo mundo.
- O link "Avaliação" da tela inicial sai; as provas ficam na trilha.
- `docs/metodologia.md` precisa ser atualizado para o novo desenho (provas por conceito em vez de prova geral).

## Tela de missões ("Seus desafios")

Esboço aprovado em `.superpowers/brainstorm/…/worlds-farm-v2.html` (2D só para mostrar a disposição).

- Cada mundo ocupa a tela inteira como uma **fazenda 3D low-poly**, no estilo das cenas atuais (mesmo construtor de mundo, mesmos objetos CC0, decisões 0007/0008/0009).
- As 10 missões são pontos ao longo de uma **trilha de terra dentro da fazenda, com formato diferente em cada mundo** (por exemplo: entre as fileiras no Milharal, contornando as árvores no Pomar, entrando e saindo da Estufa).
- A trilha começa com o ponto **"Prova inicial"** e termina, depois da missão 10, com o ponto **"Prova final"**.
- Estados do ponto: concluído (verde), próximo (amarelo), fechado (apagado). A missão 10 tem um marco de desafio final.
- No canto superior esquerdo: nome do mundo, conceito e barra "x de 10 missões".
- **Setas nas laterais** passam ao mundo anterior/seguinte.
- **Abaixo, uma bolinha por mundo**: cheia se completo, preenchida em parte se em andamento, apagada se fechado; clicar leva ao mundo.
- Mundo fechado aparece escurecido, com cadeado e o aviso "Conclua o mundo <anterior> para abrir este".
- Clicar num ponto abre o cartão: papel (Conhecer/Praticar/Apertar/Consertar/Desafio final, ou Prova inicial/final), título, objetivo e botão "Jogar" (ou "Fazer a prova").
- A tela abre no mundo em que o aluno está.
- O treinamento não aparece nessa tela.

## Cenário dentro da missão

A fazenda em volta da grade de jogo usa o cenário do mundo da missão (objetos, cores e plantas em volta). As plantas que crescem nos canteiros da grade também combinam com o mundo (milho no Milharal, por exemplo), sem mudar nenhuma regra do jogo — decisão minha, a validar jogando.

## Objetos 3D

Reaproveitar os objetos existentes (celeiro, silo, moinho, árvores, macieira, cercas, animais, pedras etc.). Criar os que faltam no mesmo estilo low-poly: pé de milho, árvores frutíferas variadas, estufa, entre outros. Seguir a política de licença CC0 já registrada (0007); modelos procedurais são aceitáveis como nos cultivos atuais (0009).

## Painel do professor

- O canteiro da turma passa a ter **uma coluna por mundo** (mais a do treinamento), cada uma mostrando "x de 10" com o visual de canteiro (vazio / tentando / concluído).
- O modal do aluno agrupa as 60 missões por mundo, mantendo o detalhe por missão que já existe, e mostra as respostas do pré e do pós de cada mundo.
- O resumo passa a falar em missões e mundos (média de missões concluídas, mundos concluídos) e mostra o ganho médio pré → pós por conceito.
- O gráfico de pré × pós passa a ser por mundo (uma linha por conceito); o filtro de escola continua valendo.
- "Tentativas e dicas por fase" passa a ser por mundo.
- Os dados de exemplo, as exportações CSV e o formato da jogada enviada ao servidor (`RunSnapshot`) acompanham as 60 missões e as 12 provas. O servidor pode passar a rejeitar o formato antigo, já que não há dados reais.

## Restrições

- Regras do projeto: sem comentários no código; identificadores e arquivos em inglês; textos para o usuário em PT-BR.
- Commits sem menção ao Claude/Anthropic e sem `Co-Authored-By`.
- Cada uma das 60 missões precisa ter solução de referência válida (`referenceSolution`), 4 dicas, explicação da solução e referência de eficiência, como as missões atuais; testes devem verificar que a solução de referência cumpre os objetivos.
- Cada pergunta precisa ter exatamente uma alternativa correta; testes devem verificar que pré e pós de cada mundo têm 10 perguntas pareadas.

## Decidido pelo usuário

- Treinamento continua sendo uma missão só.
- 6 mundos, um por conceito, na ordem e com os nomes da tabela; 10 missões cada; ritmo de 10 missões da tabela.
- Cenário próprio por mundo; a missão também usa o cenário do mundo.
- Tela de missões: fazenda 3D low-poly por mundo, trilha diferente em cada mundo, setas laterais, bolinhas de índice embaixo.
- Pré-teste antes de cada mundo e pós-teste depois das 10 missões, 10 perguntas cada; a prova geral sai.
- Precisa concluir o mundo (missões e pós-teste) para abrir o próximo.
- Tempo de aula não é restrição.
- Os dados atuais eram de teste e foram apagados.
- O Claude cria as 60 missões e as 120 perguntas; o usuário valida jogando.

## Decisões minhas (para conferir)

- As provas aparecem como primeiro e último ponto da trilha de cada mundo.
- Pós-teste pareado com o pré-teste, como hoje.
- Plantas da grade combinam com o mundo.
- Link "Avaliação" da tela inicial removido.
- O ganho pré × pós no painel passa a ser por conceito em vez de por escola.

## Deixado para o construtor

- O conteúdo das 60 missões e das 120 perguntas, seguindo o ritmo e as regras acima.
- O formato exato de cada trilha e a composição de cada fazenda.
- Se e como as 6 fases atuais são reaproveitadas.
- A forma de modelar mundos e provas no código e de dividir a entrega em etapas.
