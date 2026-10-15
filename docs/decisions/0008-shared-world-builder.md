# 0008 — Mundo compartilhado gerado por função pura

**Contexto:** as cenas pareciam vazias, com proporções erradas, e cada uma tinha seu próprio espalhamento de árvores.

**Decisão:** uma função pura `buildWorld({ layout, gridWidth, gridHeight, seed, density })` gera terreno (polilinhas de caminho e rio), props, pasto, animais e borboletas para `farm`, `map` e `home`, com regras testadas (grid livre e visível, caminhos e rio livres, objetos altos fora da frente da câmera). A renderização usa instancing por modelo; animais seguem uma máquina de estados pura animada com Motion.

**Consequências:** cenas cheias e coerentes com a referência, determinísticas por semente e testáveis sem WebGL; 56 modelos e cerca de 3 MB de assets; a splash de carregamento esconde o tempo de download.
