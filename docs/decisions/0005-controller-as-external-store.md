# 0005 — Controller de execução como external store

**Contexto:** a spec previa uma store Zustand de sessão. O controller já mantém o estado completo da partida e precisa evitar execuções duplicadas.

**Decisão:** `ExecutionController` publica snapshots imutáveis e é assinado com `useSyncExternalStore`. Zustand fica para progresso e configurações persistidas.

**Consequências:** uma única fonte de verdade para o estado da partida; o controller é testável sem React com um `Scheduler` manual.
