import { lazy, Suspense, useState, type KeyboardEvent } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { panelId, PillTabs, tabId, type TabItem } from '@/components/game/PillTabs'
import { LEGEND_PAGES, type LegendPageId } from '@/features/legend/legendPages'
import { LegendTile2D } from '@/features/legend/LegendTile2D'
import './LegendDialog.css'

const LegendPreview3D = lazy(() => import('@/features/legend/LegendPreview3D'))

const PREFIX = 'legend'
const TABS: TabItem[] = LEGEND_PAGES.map((page) => ({ id: page.id, label: page.title }))

function LegendBody({ use3d, reducedMotion }: { use3d: boolean; reducedMotion: boolean }) {
  const [pageId, setPageId] = useState<LegendPageId>('empty')
  const index = LEGEND_PAGES.findIndex((page) => page.id === pageId)
  const page = LEGEND_PAGES[index]
  const go = (delta: number) => setPageId(LEGEND_PAGES[(index + delta + LEGEND_PAGES.length) % LEGEND_PAGES.length].id)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    go(event.key === 'ArrowLeft' ? -1 : 1)
  }
  const tile = <LegendTile2D preview={page.preview} />

  return (
    <DialogSection>
      <div className="legend__layout" onKeyDown={onKeyDown}>
        <PillTabs items={TABS} active={pageId} onChange={(id) => setPageId(id as LegendPageId)} label="Páginas da legenda" idPrefix={PREFIX} orientation="vertical" />
        <div role="tabpanel" id={panelId(PREFIX, pageId)} aria-labelledby={tabId(PREFIX, pageId)} className="legend__panel">
          <div className="legend__preview">
            {use3d ? (
              <Suspense fallback={tile}>
                <LegendPreview3D preview={page.preview} reducedMotion={reducedMotion} />
              </Suspense>
            ) : (
              tile
            )}
          </div>
          <p className="legend__group">{page.group}</p>
          <h3 className="legend__title">{page.title}</h3>
          <p className="legend__description">{page.description}</p>
          <dl className="legend__facts">
            {page.reachedBy && (
              <>
                <dt>Chega aqui com</dt>
                <dd>{page.reachedBy}</dd>
              </>
            )}
            {page.next && (
              <>
                <dt>Próximo passo</dt>
                <dd>{page.next}</dd>
              </>
            )}
            {page.sensor && (
              <>
                <dt>Sensor</dt>
                <dd>{page.sensor}</dd>
              </>
            )}
          </dl>
          <div className="legend__pager">
            <GameButton tone="secondary" icon="back" aria-label="Página anterior" onClick={() => go(-1)} />
            <span aria-live="polite">
              {index + 1}/{LEGEND_PAGES.length}
            </span>
            <GameButton tone="secondary" icon="forward" aria-label="Próxima página" onClick={() => go(1)} />
          </div>
        </div>
      </div>
    </DialogSection>
  )
}

interface LegendDialogProps {
  open: boolean
  onClose: () => void
  use3d: boolean
  reducedMotion: boolean
}

export function LegendDialog({ open, onClose, use3d, reducedMotion }: LegendDialogProps) {
  return (
    <GameDialog open={open} title="Legenda" icon="book" tone="info" size="fixed" onClose={onClose}>
      <LegendBody use3d={use3d} reducedMotion={reducedMotion} />
    </GameDialog>
  )
}
