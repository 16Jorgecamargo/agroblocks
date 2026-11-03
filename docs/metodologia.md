# Metodologia de avaliação da aprendizagem — AgroBlocks

## 1. Lacuna investigada

Estudantes do Ensino Médio costumam ter dificuldade em transformar a descrição de um problema em uma sequência de instruções, em reconhecer padrões que pedem repetição e em decidir quando uma condição precisa ser verificada. Ambientes de blocos genéricos ensinam a sintaxe visual, mas raramente oferecem um contexto com consequências observáveis e recursos limitados. O AgroBlocks investiga se um jogo de automação agrícola, em que o aluno programa um robô e vê o efeito de cada instrução, apoia a construção desses conceitos.

## 2. Objetivos pedagógicos

O jogo tem um treinamento e seis mundos, um por conceito, com 5 missões cada. Ao final dos seis mundos, espera-se que o estudante consiga:

1. Ordenar instruções para atingir um objetivo (sequenciamento).
2. Identificar padrões e representá-los com laços de contagem (repetição).
3. Usar condições para decidir entre ações (condicionais).
4. Usar sensores e laços "enquanto" para lidar com situações de tamanho desconhecido.
5. Usar variáveis para controlar recursos.
6. Localizar e corrigir erros em programas existentes (depuração) e comparar soluções corretas quanto à eficiência.

## 3. Instrumentos

| Instrumento | Onde | Conteúdo |
|---|---|---|
| Prova inicial de cada mundo (forma A) | `#/avaliacao/<mundo>/pre`, antes da primeira missão do mundo | 5 itens de programação sobre o conceito do mundo, sem depender do jogo: 2 de montar, 2 de prever e 1 de consertar |
| Prova final de cada mundo (forma B) | `#/avaliacao/<mundo>/pos`, depois da quinta missão do mundo | 5 itens equivalentes, em pares com a forma A |
| Registros de jogo | automáticos | cada execução, erros, dicas, recursos, eficiência |

Cada item da forma A tem um par na forma B (`pairId`) com mesma estrutura e dificuldade e cenário diferente, para reduzir o efeito de memorização. Durante as provas o aluno não recebe retorno de acerto; ao concluir, vê a pontuação, a resposta certa e a explicação de cada item. O mundo seguinte só abre depois da prova final do anterior, então cada conceito tem sua própria medida antes e depois da prática.

## 4. Indicadores coletados

Por tentativa (`agroblocks_tentativas_<data>.csv`): jogada, missão, mundo, número da missão no mundo, número da tentativa, data/hora, resultado (sucesso, objetivo não cumprido, erro), código do erro, comandos executados, blocos usados, dicas reveladas até o momento, estrelas de eficiência e pseudocódigo do programa.

Por avaliação (`agroblocks_avaliacoes_<data>.csv`): mundo, forma (pré ou pós), item, habilidade (montar, prever, consertar), resposta e se está correta.

Por aluno (`agroblocks_alunos_<data>.csv`): missões concluídas, mundos concluídos e, por mundo, missões concluídas e acertos da prova inicial e da final.

## 5. Procedimento sugerido

1. Obter autorização da escola e, para menores de idade, Termo de Consentimento dos responsáveis (TCLE) e Termo de Assentimento do estudante (TALE), conforme as normas do comitê de ética aplicável.
2. Cada aluno informa nome completo e escola ao iniciar a fazenda. Os dados vão para o servidor do projeto (veja o README).
3. Primeira sessão: Treinamento e início da Horta (prova inicial + missões).
4. Sessões seguintes: um mundo de cada vez, no ritmo da turma. Cada mundo começa com a prova inicial e termina com a prova final; não é preciso encaixar o mundo inteiro numa aula.
5. O pesquisador acompanha pelo painel em que mundo cada aluno está.
6. Abrir `#/painel` (senha do professor) e exportar os três CSV, que já trazem todos os alunos com nome e escola.
7. Antes de outro aluno usar a mesma máquina, ele clica em "Iniciar nova fazenda" e se cadastra; os dados do anterior continuam no servidor.

## 6. Análise

- Comparar, em cada mundo, os acertos da prova inicial e da final (pares de itens), também por habilidade. Para amostras pequenas, usar teste não paramétrico pareado (Wilcoxon) por conceito e relatar tamanhos de efeito.
- Cruzar dados de uso (tentativas, erros mais frequentes, dicas) com os resultados do pós-teste de forma descritiva.
- Relatar separadamente, por mundo, os alunos que não chegaram à prova final.

## 7. Dados de uso × evidências de aprendizagem

Dados de uso mostram **o que aconteceu no jogo** (quantas tentativas, quais erros). Eles não mostram, sozinhos, que o aluno aprendeu: concluir uma missão pode resultar de tentativa e erro ou da dica com exemplo parcial. Evidência de aprendizagem exige instrumentos independentes do jogo (pré/pós-teste) e, idealmente, comparação com um grupo que não usou o jogo. O painel do aplicativo exibe essa ressalva e marca dados de demonstração como fictícios.

## 8. Limitações

- Amostra provavelmente pequena e de conveniência.
- Sem grupo controle no desenho básico; ganhos podem vir de outras aulas ou de maturação.
- Efeito novidade do jogo pode inflar o engajamento.
- Itens de múltipla escolha capturam parte da compreensão; não avaliam produção de programas longos.
- Dados ficam no navegador: limpar o navegador apaga registros não exportados; um navegador por aluno.
- Computadores sem WebGL usam a visualização 2D, o que pode alterar a experiência.

## 9. Ética e privacidade

Nome completo e escola do aluno, progresso e respostas são enviados ao servidor do projeto e ficam acessíveis só com a senha do professor. Por isso, a participação de menores em pesquisa exige autorização institucional e consentimento dos responsáveis. Os resultados só devem ser apresentados como evidência depois da coleta e análise reais; antes disso, o painel deve ser tratado como demonstração.
