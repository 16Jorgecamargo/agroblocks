import type { LegendPreview } from '@/features/legend/legendPages'
import { PLOT_GLYPHS, TERRAIN_GLYPHS } from '@/render/grid2d/Grid2D'

export function LegendTile2D({ preview }: { preview: LegendPreview }) {
  const isSoil = preview.terrain === 'soil'
  const glyph = preview.terrain === 'soil' ? PLOT_GLYPHS[preview.plot] : TERRAIN_GLYPHS[preview.terrain]
  const classes = [
    'grid2d__cell',
    'legend__tile',
    `grid2d__cell--${preview.terrain}`,
    isSoil ? `grid2d__cell--${preview.plot}` : '',
    preview.moisture === 'wet' ? 'grid2d__cell--wet' : '',
    preview.goal ? 'grid2d__cell--goal' : '',
  ]
  return (
    <div className={classes.join(' ')} aria-hidden="true">
      <span className="grid2d__glyph">{glyph}</span>
      {isSoil && preview.moisture === 'wet' && <span className="grid2d__drop">💧</span>}
    </div>
  )
}
