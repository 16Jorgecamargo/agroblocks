import { useState } from 'react'
import { Link } from 'react-router'
import { Modal } from '@/components/ui/Modal'
import { Tabs, panelId, tabId, type TabItem } from '@/components/ui/Tabs'
import { Toggle } from '@/components/ui/Toggle'
import { Icon } from '@/components/icons/Icon'
import { SPEEDS, type Speed } from '@/game/execution/types'
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

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState('general')
  const [confirmReset, setConfirmReset] = useState(false)
  const settings = useSettingsStore((store) => store.settings)
  const update = useSettingsStore((store) => store.update)
  const participantCode = useProgressStore((store) => store.save.participantCode)
  const setParticipantCode = useProgressStore((store) => store.setParticipantCode)
  const resetProgress = useProgressStore((store) => store.resetProgress)
  const [code, setCode] = useState(participantCode ?? '')

  return (
    <Modal title="Configurações" onClose={onClose} size="lg" className="settings">
      <div className="settings__layout">
        <Tabs items={TABS} active={tab} onChange={setTab} label="Seções das configurações" idPrefix={PREFIX} orientation="vertical" />
        <div role="tabpanel" id={panelId(PREFIX, tab)} aria-labelledby={tabId(PREFIX, tab)} className="settings__panel">
          {tab === 'general' && (
            <>
              <label className="field">
                <span className="field__label">Idioma</span>
                <select value="pt-BR" disabled aria-describedby="language-note">
                  <option value="pt-BR">Português (Brasil)</option>
                </select>
              </label>
              <p id="language-note" className="settings__note">Esta versão está disponível apenas em português.</p>
              <Toggle label="Modo escuro" checked={settings.theme === 'dark'} onChange={(on) => update({ theme: on ? 'dark' : 'light' })} />
            </>
          )}
          {tab === 'sound' && (
            <>
              <Toggle label="Música" checked={settings.musicEnabled} onChange={(on) => update({ musicEnabled: on })} />
              <Toggle label="Efeitos sonoros" checked={settings.soundEnabled} onChange={(on) => update({ soundEnabled: on })} />
            </>
          )}
          {tab === 'visual' && (
            <>
              <Toggle
                label="Reduzir animações"
                description="Remove movimentos suaves, partículas e giros automáticos."
                checked={settings.motion === 'reduced'}
                onChange={(on) => update({ motion: on ? 'reduced' : 'system' })}
              />
              <Toggle
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
                <input
                  value={code}
                  maxLength={32}
                  placeholder="Ex.: ALUNO-07"
                  onChange={(event) => setCode(event.target.value)}
                  onBlur={() => setParticipantCode(code)}
                />
              </label>
              <p className="settings__note">
                Use apenas um código combinado com o professor. Não digite nome, e-mail ou outros dados pessoais. Os dados ficam somente neste navegador.
              </p>
              <Link to="/painel" className="button button--ghost" onClick={onClose}>
                <Icon name="chart" /> Abrir painel e exportar dados
              </Link>
              {confirmReset ? (
                <div className="settings__confirm" role="alert">
                  <p>Tem certeza? Todo o progresso, tentativas e respostas de avaliação deste navegador serão apagados.</p>
                  <div className="settings__confirm-actions">
                    <button
                      type="button"
                      className="button button--danger"
                      onClick={() => {
                        resetProgress()
                        setConfirmReset(false)
                        setCode('')
                      }}
                    >
                      Sim, apagar tudo
                    </button>
                    <button type="button" className="button" onClick={() => setConfirmReset(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="button button--danger settings__reset" onClick={() => setConfirmReset(true)}>
                  <Icon name="trash" /> Reiniciar progresso
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
