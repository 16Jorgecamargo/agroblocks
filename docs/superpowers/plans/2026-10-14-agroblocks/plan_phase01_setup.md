# AgroBlocks — Fase 1: Base do projeto

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Projeto Vite + React + TypeScript estrito executável, com Vitest, alias `@/`, tokens de design, roteamento HashRouter e página inicial mínima.

**Architecture:** Scaffold manual (diretório já contém `docs/`), sem `npm create`. Testes unitários colocados ao lado do código (`*.test.ts(x)`), ambiente jsdom.

**Tech Stack:** React 19, react-router 7, Vite, TypeScript strict, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md`

Leia `plan_index.md` (Global Constraints e Review Focus) antes de começar.

---

### Task 1.1: Scaffold, tooling e shell da aplicação

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/app/routes.tsx`
- Create: `src/styles/tokens.css`, `src/styles/global.css`
- Create: `src/features/home/HomePage.tsx`
- Create: `src/test/setup.ts`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Produces: `App` component; `appRoutes: RouteObject[]` em `src/app/routes.tsx` (fases seguintes adicionam entradas); alias `@/` → `src/`; classes utilitárias `.button`, `.button--primary`, `.button--ghost`, `.card`, `.visually-hidden`, `.page`.

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "agroblocks",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Instalar dependências (versões estáveis mais recentes)**

```bash
npm install react react-dom react-router zustand zod blockly three @react-three/fiber @react-three/drei
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/three @types/node vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

Expected: instalação sem erros de peer dependency. Se `@react-three/fiber` reclamar da versão do React, instale a versão do fiber compatível com o React instalado (fiber 9.x ↔ React 19).

- [ ] **Step 3: Criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 4: Criar `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

- [ ] **Step 5: Criar `index.html`, `.gitignore`, `src/test/setup.ts`**

`index.html`:
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AgroBlocks: jogo educativo de automação agrícola e programação em blocos." />
    <title>AgroBlocks</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`.gitignore`:
```
node_modules
dist
coverage
test-results
playwright-report
.DS_Store
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
```

- [ ] **Step 6: Escrever o teste que falha `src/app/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { App } from '@/app/App'

describe('App', () => {
  it('renders the home page brand and tagline', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'AgroBlocks' })).toBeInTheDocument()
    expect(screen.getByText('Automatize. Programe. Cultive.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx vitest run src/app/App.test.tsx`
Expected: FAIL — `Failed to resolve import "@/app/App"`.

- [ ] **Step 8: Criar tokens e estilos globais**

`src/styles/tokens.css`:
```css
:root {
  --green-900: #183d2d;
  --green-600: #358653;
  --green-200: #b9dca8;
  --cream-50: #f5f7f0;
  --earth-500: #806044;
  --water-500: #4185d6;
  --sun-400: #f2c14e;
  --night-900: #15221c;
  --danger-600: #c0392b;
  --cat-movement: #4c8df6;
  --cat-farm: #3fa34d;
  --cat-sensor: #e0a526;
  --cat-control: #8e5be8;
  --cat-number: #3d9aa3;
  --cat-variable: #f07c2a;
  --cat-procedure: #e0508f;
  --cat-event: #e0a526;
  --chrome-bg: #15221c;
  --chrome-surface: #1e3128;
  --chrome-border: #2e4a3b;
  --chrome-text: #eef5ea;
  --chrome-text-muted: #a9bfae;
  --exit-600: #e5484d;

  --color-bg: var(--cream-50);
  --color-surface: #ffffff;
  --color-surface-alt: #eaf1e2;
  --color-text: #13261c;
  --color-text-muted: #4b5f53;
  --color-border: #c9d8c0;
  --color-primary: var(--green-600);
  --color-primary-strong: var(--green-900);
  --color-on-primary: #ffffff;
  --color-accent: var(--sun-400);
  --color-water: var(--water-500);
  --color-danger: var(--danger-600);
  --color-success: #2b7a45;
  --color-focus: var(--sun-400);

  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.75rem;
  --text-2xl: 2.5rem;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgb(19 38 28 / 0.12);
  --shadow-md: 0 6px 18px rgb(19 38 28 / 0.14);
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --tap-size: 44px;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-bg: var(--night-900);
    --color-surface: #1d2e25;
    --color-surface-alt: #243a2e;
    --color-text: #e8f1e3;
    --color-text-muted: #a9bfae;
    --color-border: #34503f;
    --color-primary: #4aa56b;
    --color-primary-strong: #b9dca8;
    --color-on-primary: #0c1a12;
  }
}

:root[data-theme='dark'] {
  --color-bg: var(--night-900);
  --color-surface: #1d2e25;
  --color-surface-alt: #243a2e;
  --color-text: #e8f1e3;
  --color-text-muted: #a9bfae;
  --color-border: #34503f;
  --color-primary: #4aa56b;
  --color-primary-strong: #b9dca8;
  --color-on-primary: #0c1a12;
}

:root[data-motion='reduced'] {
  --duration-fast: 0ms;
  --duration-base: 0ms;
}

@media (prefers-reduced-motion: reduce) {
  :root:not([data-motion='full']) {
    --duration-fast: 0ms;
    --duration-base: 0ms;
  }
}
```

`src/styles/global.css`:
```css
@import './tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-md);
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3 {
  line-height: 1.2;
  margin: 0 0 var(--space-3);
}

a {
  color: var(--color-primary);
}

:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--tap-size);
  min-width: var(--tap-size);
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: transform var(--duration-fast) ease, background var(--duration-fast) ease;
}

.button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button--primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}

.button--accent {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #1d1a0e;
}

.button--ghost {
  background: transparent;
}

.button--danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .page {
    padding: var(--space-4);
  }
}
```

- [ ] **Step 9: Criar `HomePage`, `routes`, `App`, `main`**

`src/features/home/HomePage.tsx` (versão mínima; Fase 9 a substitui):
```tsx
export function HomePage() {
  return (
    <main className="page">
      <h1>AgroBlocks</h1>
      <p>Automatize. Programe. Cultive.</p>
    </main>
  )
}
```

`src/app/routes.tsx`:
```tsx
import type { RouteObject } from 'react-router'
import { HomePage } from '@/features/home/HomePage'

export const appRoutes: RouteObject[] = [{ path: '/', element: <HomePage /> }]
```

`src/app/App.tsx`:
```tsx
import { HashRouter, useRoutes } from 'react-router'
import { appRoutes } from '@/app/routes'

function AppRoutes() {
  return useRoutes(appRoutes)
}

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/styles/global.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 10: Rodar teste, typecheck e build**

Run: `npx vitest run && npm run typecheck && npx vite build`
Expected: 1 teste PASS, typecheck sem erros, build gera `dist/`.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html .gitignore src
git commit -m "chore: scaffold AgroBlocks with Vite, React, TypeScript and Vitest"
```
