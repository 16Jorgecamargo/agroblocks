# Phase 2 — Content (Tasks 5–11)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 5: Block limit rule

**Files:**
- Modify: `src/features/gameplay/useGameplaySession.ts` (`readyProgram`), `src/features/gameplay/components/BriefingDialog.tsx`, `src/features/gameplay/components/GameHud.tsx`
- Test: `src/features/gameplay/GameplayPage.test.tsx`

**Interfaces:**
- Consumes: `MissionDefinition.rules.maxBlocks?: number` (Task 1)
- Produces: when `serialized.ok && mission.rules.maxBlocks !== undefined && serialized.blockCount > mission.rules.maxBlocks`, `readyProgram` logs `` `Use no máximo ${max} blocos. Seu programa tem ${count}.` `` as an error and returns `null` (nothing runs, nothing is recorded). Briefing and HUD show `` `Limite: ${max} blocos` `` when the rule exists.

- [ ] **Step 1: Write the failing test** `blocks running over the block limit without recording an attempt`: render a test mission with `rules.maxBlocks: 2` and an `initialProgram` of 3 actions, click "Executar", expect the log to contain `Use no máximo 2 blocos. Seu programa tem 3.` and `useProgressStore.getState().save.attempts` to have length 0.
- [ ] **Step 2–4:** run (`npx vitest run src/features/gameplay`), implement, run.
- [ ] **Step 5: Commit** `git commit -m "feat(gameplay): optional block limit per mission"`

### Shared rules for Tasks 6–11 (one task per world)

Each world task:
1. Creates the missing mission files so the world has slots 1–10 (the moved old mission keeps its slot), its `index.ts`, and registers the array in `src/data/missions/index.ts`.
2. Fills `src/data/assessment/<world>.ts` with 10 pairs (20 items): pairs 1–4 `skill: 'build'`, 5–7 `'predict'`, 8–10 `'debug'`; each B item mirrors its A item's kind and difficulty in a different scenario. Existing items moved in Task 3 may be kept if they fit the world's concept.
3. Adds the world id to `READY_WORLDS` in `src/data/missions/worldMissions.test.ts` (created in Task 6) and in `src/data/assessment/items.test.ts`.

`src/data/missions/worldMissions.test.ts` (created in Task 6, iterates `READY_WORLDS`):
```ts
it.each(READY_WORLDS)('%s has slots 1 to 10', (world) => {
  expect(missionsOfWorld(world, MISSIONS).map((mission) => mission.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})
it.each(READY_WORLDS)('%s mission 1 starts from a partial program', (world) => {
  expect(missionsOfWorld(world, MISSIONS)[0].initialProgram).toBeDefined()
})
it.each(READY_WORLDS)('%s mission 9 starts from a program that fails', (world) => {
  const debug = missionsOfWorld(world, MISSIONS)[8]
  expect(debug.initialProgram).toBeDefined()
  expect(play(debug, debug.initialProgram!).validation.success).toBe(false)
})
it.each(READY_WORLDS)('%s missions 7 and 8 have a limit', (world) => {
  for (const mission of missionsOfWorld(world, MISSIONS).slice(6, 8)) {
    const limited = mission.rules.maxBlocks !== undefined || (mission.constraints?.length ?? 0) > 0 || mission.rules.forbidWaterWet === true
    expect(limited).toBe(true)
  }
})
it.each(READY_WORLDS)('%s reference solutions from mission 2 on use the key block of the world', (world) => {
  const key = getWorld(world).keyBlock
  if (!key) return
  for (const mission of missionsOfWorld(world, MISSIONS).slice(1)) expect(programBlockTypes(mission.referenceSolution)).toContain(key)
})
it.each(READY_WORLDS)('%s keeps the blocks of earlier worlds available', (world) => {
  const earlier = WORLDS.filter((item) => item.order < getWorld(world).order).map((item) => item.keyBlock).filter(Boolean)
  for (const mission of missionsOfWorld(world, MISSIONS)) for (const block of earlier) expect(mission.allowedBlocks).toContain(block)
})
it.each(READY_WORLDS)('%s reference solutions respect the block limit', (world) => {
  for (const mission of missionsOfWorld(world, MISSIONS).filter((item) => item.rules.maxBlocks)) {
    expect(countProgramBlocks(mission.referenceSolution)).toBeLessThanOrEqual(mission.rules.maxBlocks!)
  }
})
```
`play` is the helper already in `missions.test.ts` (move it to `src/game/testing/playMission.ts` and import from both). `countProgramBlocks(program: Program): number` is added to `src/blocks/analysis/programBlockTypes.ts`, counting the blocks the serializer would count (one per statement, sensor, compare/logic/arith/number/var expression, plus `when_run` and one per procedure definition); its unit test compares against `serializeWorkspace(programToWorkspaceJson(p)).blockCount` for every existing mission reference.

The generic tests already in `missions.test.ts` (solvable reference, allowed blocks only, four hints, efficiency) run over every mission automatically.

Per world: Step 1 add the world to `READY_WORLDS` (tests fail), Step 2 run `npx vitest run src/data` (FAIL), Step 3 write the missions and items, Step 4 run `npx vitest run --maxWorkers=2` (PASS), Step 5 commit `feat(missions): <world name> with ten missions and its tests`.

Mission briefs below fix the idea of each slot; maps, numbers, hints and texts are the implementer's. Copy for the student is PT-BR, short, in the voice of the existing missions.

### Task 6: Horta (`garden`, sequência)

Allowed blocks: movement, turns, prepare, plant, water, harvest (`farm_collect` from slot 10 if a reservoir is used). No loops.

| slot | brief |
|---|---|
| 1 | Primeiros passos: andar até a planta madura e colher; programa inicial já tem os primeiros movimentos |
| 2 | Plantar: andar, preparar o solo e plantar em um canteiro |
| 3 | Cuidar do canteiro: preparar, plantar e regar, nessa ordem |
| 4 | (moved) Primeira colheita |
| 5 | Dois canteiros seguidos: cuidar de dois canteiros em sequência |
| 6 | Contornar a pedra: caminho com obstáculo e duas curvas até a colheita |
| 7 | Energia contada: `maxEnergyUsed` sem margem para passos extras |
| 8 | Sementes contadas: `maxSeedsUsed` igual ao número de canteiros-alvo |
| 9 | Consertar: programa com uma curva para o lado errado |
| 10 | Horta em L: preparar, plantar e regar 3 canteiros com curvas |

Items: build = escolher a sequência certa; predict = onde o robô termina / o que acontece; debug = qual linha está fora de ordem.

### Task 7: Milharal (`cornfield`, repetição)

Adds `controls_repeat_ext`.

| slot | brief |
|---|---|
| 1 | Andar 5 casas com repita; programa inicial tem o repita vazio |
| 2 | (moved) Plantação em série |
| 3 | Regar uma fileira com repita |
| 4 | Duas fileiras com curva entre elas |
| 5 | Fileira com pedras em posições regulares |
| 6 | Repita com várias ações dentro (preparar, plantar, regar) |
| 7 | Fileira de 8 com `maxBlocks: 5` |
| 8 | Pouca energia: `maxEnergyUsed` |
| 9 | Consertar: número de repetições errado |
| 10 | Repita dentro de repita num canteiro 3×3 |

Items: build = qual programa faz o mesmo que uma sequência longa; predict = quantas vezes / quantas sementes; debug = número de repetições errado.

### Task 8: Pomar (`orchard`, condições)

Adds `controls_if` and the sensors `sensor_plant_mature`, `sensor_soil_dry`, `sensor_plot_empty`.

| slot | brief |
|---|---|
| 1 | Colher só se estiver madura; programa inicial tem o `se` sem a ação |
| 2 | Regar só se o solo estiver seco, em um canteiro |
| 3 | Plantar só se o canteiro estiver vazio |
| 4 | (moved) Irrigação inteligente |
| 5 | Fileira com plantas maduras e crescendo: colher só as maduras |
| 6 | Se/senão: regar se seco, senão colher |
| 7 | Sem desperdício: `forbidWaterWet: true` com solos mistos |
| 8 | Água contada: `maxWaterUsed` |
| 9 | Consertar: condição trocada (sensor errado) |
| 10 | Pomar 3×3 com estados misturados |

Items: build = qual condição envolve a ação; predict = o que o robô faz neste canteiro; debug = qual linha precisa ficar dentro do `se`.

### Task 9: Estufa (`greenhouse`, sensores e enquanto)

Adds `controls_whileUntil`, `sensor_obstacle_ahead`, `sensor_has_seeds`, `logic_negate`.

| slot | brief |
|---|---|
| 1 | Andar enquanto não houver obstáculo à frente; programa inicial tem o enquanto vazio |
| 2 | Plantar enquanto houver sementes |
| 3 | (moved) Colheita automatizada |
| 4 | Duas fileiras de tamanhos diferentes com o mesmo enquanto |
| 5 | Ir até a parede, virar e voltar |
| 6 | Enquanto com duas ações e um `se` dentro |
| 7 | Energia contada: `maxEnergyUsed` |
| 8 | `maxBlocks` que só cabe usando enquanto |
| 9 | Consertar: condição do enquanto invertida (o robô bate ou para cedo) |
| 10 | Estufa completa: percorrer todas as fileiras com enquanto e se |

Items: build = qual condição faz o laço parar no lugar certo; predict = quantas vezes o laço roda; debug = laço que nunca termina ou não começa.

### Task 10: Celeiro (`barnyard`, variáveis)

Adds `variables_set`, `variables_get`, `math_change`, `math_number`, `math_arithmetic`, `logic_compare`, `farm_collect`.

| slot | brief |
|---|---|
| 1 | Guardar o número de canteiros numa variável e usar no repita; programa inicial já cria a variável |
| 2 | Contador: andar enquanto contador < 5 |
| 3 | Água como variável: regar enquanto água > 0 |
| 4 | Duas variáveis: sementes e água |
| 5 | (moved) Recursos limitados |
| 6 | Variável diminuindo para fileiras de tamanhos diferentes |
| 7 | Recursos contados: `maxWaterUsed` e `maxSeedsUsed` |
| 8 | `maxBlocks` que exige reaproveitar a variável |
| 9 | Consertar: a variável nunca diminui (laço sem fim) |
| 10 | Celeiro completo: reabastecer e cuidar de duas fileiras |

Items: build = qual bloco guarda/atualiza o valor; predict = valor final da variável; debug = variável começando errada ou sem atualizar.

### Task 11: Fazenda completa (`homestead`, eficiência)

Adds `procedures_defnoreturn`, `procedures_callnoreturn` (all blocks allowed from here).

| slot | brief |
|---|---|
| 1 | Criar o procedimento "cuidar"; programa inicial já tem o procedimento vazio |
| 2 | Usar o procedimento numa fileira |
| 3 | Procedimento com curva no fim da fileira |
| 4 | Dois procedimentos (cuidar e virar) |
| 5 | Procedimento com `se` dentro |
| 6 | Procedimento dentro de enquanto |
| 7 | `maxBlocks` apertado |
| 8 | Energia contada: `maxEnergyUsed` |
| 9 | Consertar: procedimento chamado no lugar errado |
| 10 | (moved) Fazenda eficiente |

Items: build = qual procedimento evita repetição; predict = quantos comandos um programa com procedimento executa; debug = erro de direção ou chamada fora de lugar.
