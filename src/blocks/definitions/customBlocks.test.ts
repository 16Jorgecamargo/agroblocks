import * as Blockly from 'blockly'
import { defineCustomBlocks } from '@/blocks/definitions/customBlocks'
import { BLOCK_FOR_ACTION, BLOCK_FOR_SENSOR } from '@/blocks/blockTypes'

describe('defineCustomBlocks', () => {
  it('registers every action, sensor and the when_run hat', () => {
    defineCustomBlocks()
    defineCustomBlocks()
    for (const type of [...Object.values(BLOCK_FOR_ACTION), ...Object.values(BLOCK_FOR_SENSOR), 'when_run']) {
      expect(Blockly.Blocks[type]).toBeDefined()
    }
  })

  it('creates sensor blocks with Boolean output', () => {
    defineCustomBlocks()
    const workspace = new Blockly.Workspace()
    const block = workspace.newBlock('sensor_soil_dry')
    expect(block.outputConnection?.getCheck()).toEqual(['Boolean'])
    expect(block.tooltip).toBeTruthy()
    workspace.dispose()
  })
})
