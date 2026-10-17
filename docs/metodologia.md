# Metodologia de avaliação da aprendizagem — AgroBlocks

## 1. Lacuna investigada

Estudantes do Ensino Médio costumam ter dificuldade em transformar a descrição de um problema em uma sequência de instruções, em reconhecer padrões que pedem repetição e em decidir quando uma condição precisa ser verificada. Ambientes de blocos genéricos ensinam a sintaxe visual, mas raramente oferecem um contexto com consequências observáveis e recursos limitados. O AgroBlocks investiga se um jogo de automação agrícola, em que o aluno programa um robô e vê o efeito de cada instrução, apoia a construção desses conceitos.

## 2. Objetivos pedagógicos

Ao final das seis fases, espera-se que o estudante consiga:

1. Ordenar instruções para atingir um objetivo (sequenciamento).
2. Identificar padrões e representá-los com laços de contagem (repetição).
3. Usar condições para decidir entre ações (condicionais).
4. Usar sensores e laços "enquanto" para lidar com situações de tamanho desconhecido.
5. Usar variáveis para controlar recursos.
6. Localizar e corrigir erros em programas existentes (depuração) e comparar soluções corretas quanto à eficiência.

## 3. Instrumentos

| Instrumento | Onde | Conteúdo |
|---|---|---|
| Pré-teste (forma A) | `#/avaliacao/pre`, antes da Fase 1 | 10 itens: 2 por conceito |
| Pós-teste (forma B) | `#/avaliacao/pos`, após concluir a Fase 6 | 10 itens equivalentes, em pares com a forma A |
| Registros de jogo | automáticos | cada execução, erros, dicas, recursos, eficiência |

Conceitos avaliados: sequenciamento, repetição, condicionais, identificação de erros, interpretação de algoritmos. Cada item da forma A tem um par na forma B (`pairId`) com mesma estrutura e dificuldade e cenário diferente, para reduzir o efeito de memorização. Durante os testes o aluno não recebe retorno de acerto.

## 4. Indicadores coletados

Por tentativa (`tentativas.csv`): missão, fase, conceito, número da tentativa, data/hora, resultado (sucesso, objetivo não cumprido, erro), código do erro, comandos executados, blocos usados, sementes/água/energia consumidas, dicas reveladas até o momento, estrelas de eficiência.

Por missão (`missoes.csv`): estado, tentativas, sucessos, erros, dicas, melhor resultado.

Por avaliação (`avaliacao.csv`): forma, item, par, conceito, resposta e se está correta.

## 5. Procedimento sugerido

1. Obter autorização da escola e, para menores de idade, Termo de Consentimento dos responsáveis (TCLE) e Termo de Assentimento do estudante (TALE), conforme as normas do comitê de ética aplicável.
2. Cada aluno informa nome completo e escola ao iniciar a fazenda. Os dados vão para o servidor do projeto (veja o README).
3. Sessão 1: pré-teste + Treinamento + Fases 1–2.
4. Sessões seguintes: Fases 3–6, no ritmo da turma.
5. Última sessão: pós-teste.
6. Abrir `#/painel` (senha do professor) e exportar os três CSV, que já trazem todos os alunos com nome e escola.
7. Antes de outro aluno usar a mesma máquina, ele clica em "Iniciar nova fazenda" e se cadastra; os dados do anterior continuam no servidor.

## 6. Análise

- Comparar acertos por conceito entre pré e pós (pares de itens). Para amostras pequenas, usar teste não paramétrico pareado (Wilcoxon) por conceito e relatar tamanhos de efeito.
- Cruzar dados de uso (tentativas, erros mais frequentes, dicas) com os resultados do pós-teste de forma descritiva.
- Relatar separadamente alunos que pularam o pré-teste ou não concluíram a Fase 6.

## 7. Dados de uso × evidências de aprendizagem

Dados de uso mostram **o que aconteceu no jogo** (quantas tentativas, quais erros). Eles não mostram, sozinhos, que o aluno aprendeu: concluir uma fase pode resultar de tentativa e erro ou da dica com exemplo parcial. Evidência de aprendizagem exige instrumentos independentes do jogo (pré/pós-teste) e, idealmente, comparação com um grupo que não usou o jogo. O painel do aplicativo exibe essa ressalva e marca dados de demonstração como fictícios.

## 8. Limitações

- Amostra provavelmente pequena e de conveniência.
- Sem grupo controle no desenho básico; ganhos podem vir de outras aulas ou de maturação.
- Efeito novidade do jogo pode inflar o engajamento.
- Itens de múltipla escolha capturam parte da compreensão; não avaliam produção de programas longos.
- Dados ficam no navegador: limpar o navegador apaga registros não exportados; um navegador por aluno.
- Computadores sem WebGL usam a visualização 2D, o que pode alterar a experiência.

## 9. Ética e privacidade

Nome completo e escola do aluno, progresso e respostas são enviados ao servidor do projeto e ficam acessíveis só com a senha do professor. Por isso, a participação de menores em pesquisa exige autorização institucional e consentimento dos responsáveis. Os resultados só devem ser apresentados como evidência depois da coleta e análise reais; antes disso, o painel deve ser tratado como demonstração.
