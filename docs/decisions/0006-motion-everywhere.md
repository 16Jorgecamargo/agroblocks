# 0006 — Motion como camada única de animação

**Contexto:** a primeira versão misturava CSS keyframes, `useFrame` manual e transições ad hoc; o resultado foi considerado fraco pelo usuário, que pediu Motion em tudo que fosse possível.

**Decisão:** `motion/react` para interface (variants, `AnimatePresence`, `layout`, `useAnimate`) e `animate()` de `motion` sobre objetos Three.js e `MotionValue`s na cena 3D. Valores nomeados em `src/motion/` a partir da Motion Reference.

**Consequências:** linguagem de movimento única; "Reduzir animações" vale para tudo via `MotionConfig`; dependência a mais (~40 KB gzip).
