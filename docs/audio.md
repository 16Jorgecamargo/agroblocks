# Gerando a trilha sonora com ACE-Step 1.5 (opcional)

O jogo não depende de música. Se quiser uma trilha ambiente, gere offline e salve como `public/audio/theme.ogg`.

1. Instale `uv` (https://docs.astral.sh/uv/) e Python 3.11 ou 3.12.
2. Clone o projeto: `git clone https://github.com/ace-step/ACE-Step-1.5 && cd ACE-Step-1.5`
3. Instale dependências: `uv sync`
4. Inicie a interface: `uv run acestep` e abra `http://localhost:7860` (em Mac com Apple Silicon o backend MPS é usado; com pouca memória, escolha o modelo turbo e desative o LM).
5. Gere uma faixa instrumental de 90 segundos. Sugestão de descrição:
   `calm cozy farming game background music, acoustic guitar, light marimba, soft percussion, cheerful, loopable, instrumental, no vocals, 95 bpm`
6. Converta para OGG: `ffmpeg -i saida.wav -c:a libvorbis -q:a 4 theme.ogg`
7. Copie para `public/audio/theme.ogg` e ligue "Música" em Configurações › Som.

O código do ACE-Step é MIT. Antes de publicar o jogo, confira os termos dos pesos do modelo usados e registre a origem da faixa no README.
