import { expect, test } from '@playwright/test'
import { MISSIONS } from '@/data/missions'
import { assignStudent, createInitialSave, recordAttempt, storeAssessment } from '@/game/progress/progression'
import { registerStudent, seedStorage, takeWorldTest } from './helpers'

const refs = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))

function gardenDoneSave() {
  let save = assignStudent(createInitialSave(refs, '2026-10-20T10:00:00.000Z'), { name: 'Rita Mundos', school: 'Escola Mundo Teste' }, 'e2e-run-rita')
  save = storeAssessment(save, { world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: {} }, refs)
  for (const mission of MISSIONS.filter((item) => item.world === 'garden')) {
    save = recordAttempt(
      save,
      { missionId: mission.id, timestamp: 't', outcome: 'success', errorCode: null, actions: 1, blocks: 1, usage: { seeds: 0, water: 0, energy: 1 }, efficiencyStars: 3, pseudocode: '' },
      refs,
    )
  }
  return save
}

test('a new student goes from the training to the Horta pre-test and its first mission', async ({ page }) => {
  await seedStorage(page, {})
  await page.goto('/')
  await page.getByRole('button', { name: 'Iniciar nova fazenda' }).click()
  await registerStudent(page, 'Teo Mundos', 'Escola Mundo Teste')
  await expect(page).toHaveURL(/#\/jogar\/m0-training$/)
  await page.getByRole('button', { name: 'Começar treinamento' }).click()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await page.getByRole('button', { name: 'Pular tutorial' }).click()
  await page.getByRole('button', { name: 'Sair do treinamento' }).click()
  await expect(page).toHaveURL(/#\/missoes$/)
  await expect(page.getByText('Mundo 1: Horta')).toBeVisible()
  await page.getByRole('region', { name: 'Prova inicial' }).getByRole('link', { name: 'Fazer a prova' }).click()
  await takeWorldTest(page, 'garden', 'pre')
  await expect(page).toHaveURL(/#\/jogar\/garden-01$/)
})

test('finishing the Horta post-test opens the Milharal', async ({ page }) => {
  await seedStorage(page, { save: gardenDoneSave() })
  await page.goto('/#/missoes')
  await page.getByRole('region', { name: 'Prova final' }).getByRole('link', { name: 'Fazer a prova' }).click()
  await takeWorldTest(page, 'garden', 'post')
  await expect(page).toHaveURL(/#\/missoes$/)
  await expect(page.getByText('Mundo 2: Milharal')).toBeVisible()
  await expect(page.getByText('Conclua o mundo Horta para abrir este')).toHaveCount(0)
})

test('a closed world shows the lock message', async ({ page }) => {
  await seedStorage(page, {})
  await page.goto('/#/missoes')
  await page.getByRole('button', { name: 'Próximo mundo' }).click()
  await expect(page.getByText('Mundo 2: Milharal')).toBeVisible()
  await expect(page.getByText('Conclua o mundo Horta para abrir este')).toBeVisible()
  await expect(page.locator('.world-stage__map canvas')).toBeVisible()
  const target = await page.evaluate(() => {
    const stage = document.querySelector('.world-stage') as HTMLElement
    const box = stage.getBoundingClientRect()
    return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.tagName
  })
  expect(target).toBe('CANVAS')
})
