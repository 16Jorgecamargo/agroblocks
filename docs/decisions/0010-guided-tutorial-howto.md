# 0010 — Tutorial guiado com animações de demonstração

**Contexto:** o balão central do treinamento cobria a fazenda, não apontava para nada e não mostrava como fazer as ações.

**Decisão:** roteiro de 15 etapas em dados, máquina de estados pura alimentada por sinais do jogo, holofote que recorta as áreas reais (`data-tutorial`) e animações de demonstração gravadas do jogo real: um roteiro do Playwright (`npm run howto:record`) abre a missão de treino, faz cada ação com uma mão fantasma desenhada por cima (e a tecla Delete do teclado na tela) e grava um vídeo curto por ação em `public/howto/`.

**Consequências:** o aluno vê cada gesto antes de praticar; as animações mostram exatamente a tela, os blocos e a fazenda que o aluno vê; qualquer mudança visual da tela exige rodar `npm run howto:record` de novo (cerca de 5 minutos, abre uma janela do Chrome fora da tela para usar a GPU). Com "Reduzir animações" o vídeo não toca sozinho: aparece um quadro parado com os controles do player.
