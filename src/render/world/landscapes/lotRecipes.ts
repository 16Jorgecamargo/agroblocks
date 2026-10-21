import type { WorldId } from '@/game/worlds/worldTypes'
import type { LotRecipe } from '@/render/world/landscapes/fillLots'

export const LOT_RECIPES: Record<WorldId, LotRecipe> = {
  garden: { kinds: ['youngCrop', 'stripes', 'furrows', 'stripes'], youngCrop: { feature: 'vegetableBed', spacing: [1.7, 1.2], scale: 0.75 }, pond: true, canal: false, vignettes: ['wheelbarrow'] },
  cornfield: { kinds: ['furrows', 'youngCrop', 'stubble', 'stripes'], youngCrop: { feature: 'cornStalk', spacing: [0.6, 0.75], scale: 0.55 }, pond: true, canal: true, vignettes: ['tractor'] },
  orchard: { kinds: ['stripes', 'youngCrop', 'stripes', 'furrows'], youngCrop: { feature: 'fruitTree', spacing: [1.4, 1.4], scale: 0.5, tint: '#e0473c' }, pond: true, canal: false, vignettes: ['wheelbarrow'] },
  greenhouse: { kinds: ['furrows', 'youngCrop', 'stripes'], youngCrop: { feature: 'vegetableBed', spacing: [1.7, 1.2], scale: 0.75 }, pond: true, canal: true, vignettes: ['wheelbarrow'] },
  barnyard: { kinds: ['stripes', 'stubble', 'furrows', 'stubble'], youngCrop: { feature: 'cornStalk', spacing: [0.6, 0.75], scale: 0.55 }, pond: true, canal: false, vignettes: ['tractor'] },
  homestead: { kinds: ['furrows', 'youngCrop', 'stripes', 'stubble'], youngCrop: { feature: 'cornStalk', spacing: [0.6, 0.75], scale: 0.55 }, pond: true, canal: true, vignettes: ['tractor', 'wheelbarrow'] },
}
