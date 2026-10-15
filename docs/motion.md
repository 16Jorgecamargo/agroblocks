# Sistema de movimento do AgroBlocks

Toda animação usa a biblioteca Motion (`motion/react` na interface, `animate()` de `motion` na cena 3D) e os valores de `src/motion/`. Os padrões vêm da Motion Reference (https://motion-reference.takayustudio.jp).

## Molas (`SPRINGS`)

| Nome | stiffness / damping / mass | Padrão de origem | Uso |
|---|---|---|---|
| snap | 180 / 13 / 0.6 | Springs › Snap | giro do robô, estados |
| bounce | 150 / 9 / 0.8 | Springs › Bounce | plantas crescendo |
| smooth | 120 / 26 / 1 | Springs › Smooth | movimento do robô, câmera |
| modal | 280 / 28 / 1 | Springs › Apple modal | painéis |
| sheet | 260 / 20 / 1 | Navigation & Overlays › Spring Sheet | diálogos |
| pill | 240 / 24 / 1 | Selection & Controls › Pill Indicator | abas, interruptores, velocidade |
| push3d | 420 / 24 / 1 | UI Buttons › 3D Push | botões |
| star | 400 / 14 / 1 | Rewards & Loot › Three Star Clear | estrelas do resultado |
| marker | 150 / 15 / 1 | Game HUD › Objective Marker | fase disponível no mapa |
| achievement | 240 / 22 / 1 | Rewards & Loot › Achievement Unlock | conceito aprendido |
| toast | 300 / 24 / 1 | Feedback & Reactions › Toast | linhas do console |
| cameraKick | 220 / 18 / 1 | Game Impact FX › Camera Kick HUD | erro do robô |
| jelly | 290 / 6.8 / 1 | UI Buttons › Jelly Squash | destaques |

## Durações e easings (`DURATIONS`, `EASINGS`)

| Preset | Duração | Easing | Padrão de origem |
|---|---|---|---|
| fadeSlide | 600ms | easeOutCubic | Entrance & Exit › Fade + Slide |
| softRise | 900ms | easeOutSine | Entrance & Exit › Soft Rise |
| snapIn | 380ms | easeOutExpo | Entrance & Exit › Snap In |
| shrinkFadeExit | 520ms | easeInCubic | Entrance & Exit › Shrink Fade Exit |
| staggerList | 760ms | easeOutCubic | List & Grid › Staggered List |
| gridWave | 900ms | easeOutCubic | List & Grid › Grid Wave |
| overshoot | 600ms | easeOutBack | Bounce & Reaction › Overshoot |
| questBanner | 800ms | easeOutExpo | Progression & Quests › Quest Banner |
| errorShake | 540ms | easeOutExpo | Attention & Emphasis › Error Shake |
| nudge | 520ms | easeOutBack | Attention & Emphasis › Nudge |
| badgePop | 450ms | easeOutBack | Attention & Emphasis › Badge Pop |
| focusHalo | 900ms | easeOutCubic | Attention & Emphasis › Focus Halo |
| blurCrossfade | 600ms | easeInOutSine | Transitions › Blur Crossfade |
| iris | 600ms | easeInCubic | Transitions › Iris |
| push | 400ms | easeInOutCubic | Transitions › Push / Slide |
| odometer | 750ms | easeOutCubic | Numbers & Data › Odometer Digit Roll |
| countUp | 2000ms | easeOutExpo | Numbers & Data › Count Up |
| rowExpand | 720ms | easeOutBack | List & Grid › Row Expand |
| harvestFlight | 900ms | easeInQuad | Game HUD › Coin Collect |
| confetti | 2800ms | linear | Feedback & Reactions › Confetti Rain |

## Regras

- Componentes não usam números de animação soltos: tudo vem de `src/motion/`.
- "Reduzir animações" ou `prefers-reduced-motion`: `MotionConfig reducedMotion="always"`; efeitos decorativos (confete, voo da colheita, partículas 3D) não montam; loops ambientes param também em "Gráficos leves".
- A velocidade de execução (0,5x–4x) escala só as molas do robô e da fazenda (`scaleSpring`).
- Animações do jogo só começam depois do evento aplicado pelo motor.
