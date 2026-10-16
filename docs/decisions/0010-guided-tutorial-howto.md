# 0010 — Tutorial guiado com animações de demonstração

**Contexto:** o balão central do treinamento cobria a fazenda, não apontava para nada e não mostrava como fazer as ações.

**Decisão:** roteiro de 15 etapas em dados, máquina de estados pura alimentada por sinais do jogo, holofote que recorta as áreas reais (`data-tutorial`) e animações de demonstração feitas com uma réplica do editor em HTML e uma mão animada, descritas como roteiros de batidas no tempo.

**Consequências:** o aluno vê cada gesto antes de praticar; as animações não dependem do Blockly e são testadas sem navegador; mudanças visuais do editor real exigem ajustar a réplica à mão.
