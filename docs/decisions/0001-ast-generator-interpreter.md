# 0001 — Interpretador próprio sobre AST com generators

**Contexto:** o jogo precisa executar o programa do aluno com pausa, passo a passo, destaque de bloco e limite de passos, sem executar código arbitrário.

**Decisão:** o JSON do Blockly é convertido em um AST tipado. Um interpretador `function*` percorre o AST e faz `yield` de cada passo (ação, condição, repetição, variável, chamada). O controller decide o ritmo e aplica cada ação no engine.

**Alternativas:** JS-Interpreter do Blockly (granularidade por nó JS, sem tipos, duas representações) e compilação para bytecode (mais código sem necessidade de serializar a execução).

**Consequências:** sem `eval`; o mesmo AST alimenta pseudocódigo, análise de repetição, validação das missões e testes. Um generator não é serializável — não é possível salvar a execução no meio, o que não é requisito.
