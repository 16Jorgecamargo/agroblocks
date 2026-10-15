import * as Blockly from 'blockly'

function style(primary: string, secondary: string, tertiary: string) {
  return { colourPrimary: primary, colourSecondary: secondary, colourTertiary: tertiary }
}

export const agroTheme = Blockly.Theme.defineTheme('agroblocks', {
  name: 'agroblocks',
  base: Blockly.Themes.Classic,
  blockStyles: {
    event_blocks: { ...style('#c98b12', '#e0a526', '#9a6a0c'), hat: 'cap' },
    movement_blocks: style('#4c8df6', '#78a9f8', '#2f6fd6'),
    farm_blocks: style('#3fa34d', '#67bb72', '#2b7a37'),
    sensor_blocks: style('#c98b12', '#e0a526', '#9a6a0c'),
    loop_blocks: style('#8e5be8', '#a984ee', '#6b3fc4'),
    logic_blocks: style('#8e5be8', '#a984ee', '#6b3fc4'),
    math_blocks: style('#3d9aa3', '#64b2b9', '#2a7178'),
    variable_blocks: style('#f07c2a', '#f39b5a', '#c35f17'),
    procedure_blocks: style('#e0508f', '#e87aab', '#b5336d'),
  },
  categoryStyles: {
    movement_category: { colour: '#4c8df6' },
    farm_category: { colour: '#3fa34d' },
    sensor_category: { colour: '#e0a526' },
    control_category: { colour: '#8e5be8' },
    number_category: { colour: '#3d9aa3' },
    variable_category: { colour: '#f07c2a' },
    procedure_category: { colour: '#e0508f' },
  },
  componentStyles: {
    workspaceBackgroundColour: '#f7f8f9',
    toolboxBackgroundColour: '#ffffff',
    toolboxForegroundColour: '#13261c',
    flyoutBackgroundColour: '#eef1f4',
    flyoutForegroundColour: '#13261c',
    scrollbarColour: '#b9dca8',
    insertionMarkerColour: '#183d2d',
  },
  fontStyle: { family: 'Inter, system-ui, sans-serif', weight: '600', size: 12 },
  startHats: true,
})
