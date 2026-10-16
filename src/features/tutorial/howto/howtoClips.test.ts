import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CLIP_NAMES, clipPosterPath, clipVideoPath, HOWTO_CLIPS } from '@/features/tutorial/howto/howtoClips'
import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'

describe('HOWTO_CLIPS', () => {
  it('has clips for every practice step', () => {
    for (const step of TUTORIAL_STEPS) if (step.kind === 'practice') expect(HOWTO_CLIPS[step.howTo].clips.length).toBeGreaterThan(0)
  })

  it('offers the three ways to delete a block, the last one being the keyboard key', () => {
    expect(HOWTO_CLIPS['delete-block'].clips.map((clip) => clip.label)).toEqual(['Lixeira', 'Biblioteca', 'Tecla Delete'])
    expect(HOWTO_CLIPS['delete-block'].clips[2].caption).toContain('teclado')
  })

  it('uses every recorded clip exactly once', () => {
    const used = Object.values(HOWTO_CLIPS).flatMap((entry) => entry.clips.map((clip) => clip.name))
    expect([...used].sort()).toEqual([...CLIP_NAMES].sort())
  })

  it('ships a video and a poster for every clip', () => {
    for (const name of CLIP_NAMES) {
      expect(existsSync(join(process.cwd(), 'public', clipVideoPath(name)))).toBe(true)
      expect(existsSync(join(process.cwd(), 'public', clipPosterPath(name)))).toBe(true)
    }
  })
})
