import * as Blockly from 'blockly'

export const FLYOUT_SCALE = 0.85

export const FIXED_SCALE_FLYOUT = 'agroFixedScaleFlyout'

class FixedScaleFlyout extends Blockly.VerticalFlyout {
  override getFlyoutScale(): number {
    return FLYOUT_SCALE
  }
}

let registered = false

export function registerFixedScaleFlyout(): void {
  if (registered) return
  Blockly.registry.register(Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX, FIXED_SCALE_FLYOUT, FixedScaleFlyout)
  registered = true
}
