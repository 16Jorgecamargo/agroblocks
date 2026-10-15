import { useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { GameButton, GameLink } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { GameToggle } from '@/components/game/GameToggle'
import { PillTabs, panelId, tabId, type TabItem } from '@/components/game/PillTabs'
import { Icon } from '@/components/icons/Icon'
import { SPEEDS, type Speed } from '@/game/execution/types'
import { fadeSlide, NUDGE } from '@/motion/presets'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Settings } from '@/services/storage/settingsStorage'
import './SettingsDialog.css'

const TABS: TabItem[] = [
  { id: 'general', label: 'Geral', icon: 'gear' },
  { id: 'sound', label: 'Som', icon: 'sound' },
  { id: 'visual', label: 'Visual', icon: 'eye' },
  { id: 'controls', label: 'Controles', icon: 'keyboard' },
  { id: 'data', label: 'Dados', icon: 'database' },
]

const PREFIX = 'settings'

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState('general')
  const [confirmReset, setConfirmReset] = useState(false)
  const settings = useSettingsStore((store) => store.settings)
  const update = useSettingsStore((store) => store.update)
  const participantCode = useProgressStore((store) => store.save.participantCode)
  const setParticipantCode = useProgressStore((store) => store.setParticipantCode)
  const resetProgress = useProgressStore((store) => store.resetProgress)
  const [code, setCode] = useState(participantCode ?? '')
  const [warningScope, animateWarning] = useAnimate()

  const askReset = () => {
    setConfirmReset(true)
    requestAnimationFrame(() => {
      if (warningScope.current) animateWarning(warningScope.current, NUDGE.keyframes, NUDGE.options)
    })
  }

  const resetBlock = (
    confirmReset ? (
                  <div className="settings__confirm" role="alert">
                    <p ref={warningScope}>
                      <Icon name="trash" /> Tem certeza? Todo o progresso, tentativas e respostas de avaliação deste navegador serão apagados.
                    </p>
                    <div className="settings__confirm-actions">
                      <GameButton
                        tone="danger"
                        onClick={() => {
                          resetProgress()
                          setConfirmReset(false)
                          setCode('')
                        }}
                      >
                        Sim, apagar tudo
                      </GameButton>
                      <GameButton tone="secondary" onClick={() => setConfirmReset(false)}>
                        Cancelar
                      </GameButton>
                    </div>
                  </div>
                ) : (
                  <GameButton tone="ghost" icon="trash" className="settings__reset" onClick={askReset}>
                    Reiniciar progresso
                  </GameButton>
                )
  )

  return (
    <GameDialog open={open} title="Configurações" icon="gear" tone="info" size="fixed" onClose={onClose}>
      <DialogSection className="settings__layout">
        <PillTabs items={TABS} active={tab} onChange={setTab} label="Seções das configurações" idPrefix={PREFIX} orientation="vertical" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            id={panelId(PREFIX, tab)}
            aria-labelledby={tabId(PREFIX, tab)}
            className="settings__panel"
            variants={fadeSlide}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {tab === 'general' && (
              <>
                <label className="settings__row">
                  <span className="field__label">Idioma</span>
                  <select value="pt-BR" disabled aria-describedby="language-note">
                    <option value="pt-BR">Português (Brasil)</option>
                  </select>
                </label>
                <p id="language-note" className="visually-hidden">
                  Esta versão está disponível apenas em português.
                </p>
                <GameToggle label="Música" checked={settings.musicEnabled} onChange={(on) => update({ musicEnabled: on })} />
                <GameToggle label="Efeitos sonoros" checked={settings.soundEnabled} onChange={(on) => update({ soundEnabled: on })} />
                <GameToggle label="Reduzir animações" checked={settings.motion === 'reduced'} onChange={(on) => update({ motion: on ? 'reduced' : 'system' })} />
                <GameToggle label="Modo escuro" checked={settings.theme === 'dark'} onChange={(on) => update({ theme: on ? 'dark' : 'light' })} />
                {resetBlock}
              </>
            )}
            {tab === 'sound' && (
              <>
                <GameToggle label="Música" checked={settings.musicEnabled} onChange={(on) => update({ musicEnabled: on })} />
                <GameToggle label="Efeitos sonoros" checked={settings.soundEnabled} onChange={(on) => update({ soundEnabled: on })} />
              </>
            )}
            {tab === 'visual' && (
              <>
                <GameToggle
                  label="Reduzir animações"
                  description="Remove movimentos, confetes, partículas e giros automáticos."
                  checked={settings.motion === 'reduced'}
                  onChange={(on) => update({ motion: on ? 'reduced' : 'system' })}
                />
                <GameToggle
                  label="Gráficos leves"
                  description="Recomendado para computadores mais simples."
                  checked={settings.lowGraphics}
                  onChange={(on) => update({ lowGraphics: on })}
                />
                <label className="field">
                  <span className="field__label">Visualização da fazenda</span>
                  <select value={settings.renderMode} onChange={(event) => update({ renderMode: event.target.value as Settings['renderMode'] })}>
                    <option value="auto">Automática</option>
                    <option value="3d">3D</option>
                    <option value="2d">2D (grade simples)</option>
                  </select>
                </label>
              </>
            )}
            {tab === 'controls' && (
              <>
                <label className="field">
                  <span className="field__label">Velocidade padrão de execução</span>
                  <select value={settings.defaultSpeed} onChange={(event) => update({ defaultSpeed: Number(event.target.value) as Speed })}>
                    {SPEEDS.map((speed) => (
                      <option key={speed} value={speed}>
                        {speed.toLocaleString('pt-BR')}x
                      </option>
                    ))}
                  </select>
                </label>
                <dl className="settings__shortcuts">
                  <dt>Ctrl + Enter</dt>
                  <dd>Executar</dd>
                  <dt>Espaço</dt>
                  <dd>Pausar ou continuar</dd>
                  <dt>. (ponto)</dt>
                  <dd>Executar um passo</dd>
                  <dt>Esc</dt>
                  <dd>Parar</dd>
                </dl>
              </>
            )}
            {tab === 'data' && (
              <>
                <label className="field">
                  <span className="field__label">Código de participante (opcional)</span>
                  <input value={code} maxLength={32} placeholder="Ex.: ALUNO-07" onChange={(event) => setCode(event.target.value)} onBlur={() => setParticipantCode(code)} />
                </label>
                <p className="settings__note">
                  Use apenas um código combinado com o professor. Não digite nome, e-mail ou outros dados pessoais. Os dados ficam somente neste navegador.
                </p>
                <GameLink to="/painel" tone="secondary" icon="chart" onClick={onClose}>
                  Abrir painel e exportar dados
                </GameLink>
                {resetBlock}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogSection>
    </GameDialog>
  )
}
