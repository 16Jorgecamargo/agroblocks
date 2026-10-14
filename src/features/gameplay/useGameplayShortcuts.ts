import { useEffect, useRef } from 'react'
import { shortcutFor, type ShortcutAction } from '@/features/gameplay/gameplayLogic'

export function useGameplayShortcuts(handlers: Record<ShortcutAction, () => void>): void {
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const action = shortcutFor({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        targetTag: target?.tagName ?? '',
        inEditor: Boolean(target?.closest('.blockly-editor, [role="dialog"]')),
      })
      if (!action) return
      event.preventDefault()
      handlersRef.current[action]()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
