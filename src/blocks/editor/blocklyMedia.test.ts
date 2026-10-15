import { existsSync } from 'node:fs'
import { BLOCKLY_MEDIA_PATH } from '@/blocks/editor/blocklyMedia'

describe('blockly media', () => {
  it('serves Blockly sprites from the app instead of an external host', () => {
    expect(BLOCKLY_MEDIA_PATH.startsWith('http')).toBe(false)
    expect(BLOCKLY_MEDIA_PATH.endsWith('blockly-media/')).toBe(true)
    expect(existsSync('public/blockly-media/sprites.svg')).toBe(true)
  })
})
