import * as Blockly from 'blockly'

class SwatchCategory extends Blockly.ToolboxCategory {
  protected override addColourBorder_(colour: string): void {
    const icon = this.iconDom_ as HTMLElement | null
    if (icon) icon.style.setProperty('--swatch', colour)
    this.rowDiv_?.style.setProperty('--swatch', colour)
  }

  override setSelected(isSelected: boolean): void {
    super.setSelected(isSelected)
    if (this.rowDiv_) this.rowDiv_.style.backgroundColor = ''
  }
}

let registered = false

export function registerSwatchCategory(): void {
  if (registered) return
  registered = true
  Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, Blockly.ToolboxCategory.registrationName, SwatchCategory, true)
}
