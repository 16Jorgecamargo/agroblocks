# Trilha sonora

O jogo já traz duas faixas em `public/audio/` (`seeds-and-sprockets.mp3` e `sunlight-on-painted-wood.mp3`), tocadas em sequência por `src/app/MusicPlayer.tsx`. Para trocar ou acrescentar faixas, coloque o arquivo em `public/audio/` e adicione o nome em `MUSIC_TRACKS`.

## Gerando novas faixas com ACE-Step 1.5 (opcional)

1. Instale `uv` (https://docs.astral.sh/uv/) e Python 3.11 ou 3.12.
2. Clone o projeto: `git clone https://github.com/ace-step/ACE-Step-1.5 && cd ACE-Step-1.5`
3. Instale dependências: `uv sync`
4. Inicie a interface: `uv run acestep` e abra `http://localhost:7860` (em Mac com Apple Silicon o backend MPS é usado; com pouca memória, escolha o modelo turbo e desative o LM).
5. Gere uma faixa instrumental de 90 segundos. Sugestão de descrição:
   `calm cozy farming game background music, acoustic guitar, light marimba, soft percussion, cheerful, loopable, instrumental, no vocals, 95 bpm`
6. Converta para MP3: `ffmpeg -i saida.wav -b:a 192k nova-faixa.mp3`
7. Copie para `public/audio/`, adicione o nome em `MUSIC_TRACKS` e ligue "Música" em Configurações › Som.

O código do ACE-Step é MIT. Antes de publicar o jogo, confira os termos dos pesos do modelo usados e registre a origem da faixa no README.
