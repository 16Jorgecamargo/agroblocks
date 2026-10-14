import * as Blockly from 'blockly'

export const PROCEDURE_FLYOUT_KEY = 'AGRO_PROCEDURES'

export function registerProcedureFlyout(workspace: Blockly.WorkspaceSvg): void {
  workspace.registerToolboxCategoryCallback(PROCEDURE_FLYOUT_KEY, (target) => {
    const [definitions] = Blockly.Procedures.allProcedures(target)
    return [
      { kind: 'block', type: 'procedures_defnoreturn', fields: { NAME: 'minha_tarefa' } },
      ...definitions.map(([name]) => ({ kind: 'block', type: 'procedures_callnoreturn', extraState: { name } })),
    ]
  })
}
