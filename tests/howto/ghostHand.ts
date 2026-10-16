export function installGhostHand(): void {
  const css = `
    .ghost-hand { position: fixed; left: 0; top: 0; width: 46px; height: 46px; z-index: 2147483647; pointer-events: none;
      transform: translate(-200px, -200px); filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35)); }
    .ghost-hand svg { position: absolute; left: -15px; top: -5px; width: 46px; height: 46px; transition: transform 120ms ease-out; transform-origin: 15px 5px; }
    .ghost-hand.is-down svg { transform: scale(0.86); }
    .ghost-hand__ring { position: absolute; left: -22px; top: -22px; width: 44px; height: 44px; border-radius: 50%;
      border: 4px solid rgba(255, 196, 0, 0.95); background: rgba(255, 196, 0, 0.25); opacity: 0; transform: scale(0.4); }
    .ghost-hand.is-down .ghost-hand__ring { animation: ghost-ring 420ms ease-out forwards; }
    @keyframes ghost-ring { 0% { opacity: 1; transform: scale(0.4); } 100% { opacity: 0; transform: scale(1.5); } }
    .ghost-key { position: fixed; left: 50%; bottom: 56px; z-index: 2147483647; pointer-events: none; display: grid; justify-items: center; gap: 8px;
      transform: translate(-50%, 30px); opacity: 0; transition: opacity 180ms ease-out, transform 180ms ease-out; font-family: system-ui, sans-serif; }
    .ghost-key.is-shown { opacity: 1; transform: translate(-50%, 0); }
    .ghost-key__cap { min-width: 132px; padding: 18px 26px; border-radius: 14px; background: linear-gradient(#ffffff, #e9edf2); color: #1b2630;
      font-size: 30px; font-weight: 800; text-align: center; border: 2px solid #1b2630; box-shadow: 0 9px 0 #1b2630, 0 14px 24px rgba(0, 0, 0, 0.35);
      transition: transform 90ms ease-out, box-shadow 90ms ease-out; }
    .ghost-key.is-down .ghost-key__cap { transform: translateY(7px); box-shadow: 0 2px 0 #1b2630, 0 6px 12px rgba(0, 0, 0, 0.3); background: linear-gradient(#fff4c2, #ffe08a); }
    .ghost-key__label { padding: 4px 12px; border-radius: 999px; background: rgba(27, 38, 48, 0.88); color: #fff; font-size: 16px; font-weight: 700; }
  `
  const handSvg = `<svg viewBox="0 0 32 32"><path d="M11 3.5c1.4 0 2.5 1.1 2.5 2.5v8.2l1-.3V4.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v9l1 .2V7c0-1.4 1.1-2.5 2.5-2.5S25.5 5.6 25.5 7v12.5c0 5.2-3.8 9.5-9 9.5h-1.2c-2.9 0-5.5-1.5-7-3.9L4 18.6c-.8-1.2-.4-2.8.8-3.5 1.1-.6 2.5-.3 3.2.7l.5.7V6c0-1.4 1.1-2.5 2.5-2.5z" fill="#fff4e0" stroke="#1b2630" stroke-width="1.6" stroke-linejoin="round"/></svg>`
  const mount = () => {
    const style = document.createElement('style')
    style.textContent = css
    document.head.append(style)
    const hand = document.createElement('div')
    hand.className = 'ghost-hand'
    hand.innerHTML = `<span class="ghost-hand__ring"></span>${handSvg}`
    const key = document.createElement('div')
    key.className = 'ghost-key'
    key.innerHTML = '<span class="ghost-key__cap"></span><span class="ghost-key__label">tecla do teclado</span>'
    document.body.append(hand, key)
    const cap = key.querySelector('.ghost-key__cap') as HTMLElement
    let hideTimer = 0
    window.addEventListener('pointermove', (event) => {
      hand.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
    }, true)
    window.addEventListener('pointerdown', () => {
      hand.classList.remove('is-down')
      void hand.offsetWidth
      hand.classList.add('is-down')
    }, true)
    window.addEventListener('pointerup', () => hand.classList.remove('is-down'), true)
    window.addEventListener('keydown', (event) => {
      window.clearTimeout(hideTimer)
      cap.textContent = event.key
      key.classList.add('is-shown', 'is-down')
    }, true)
    window.addEventListener('keyup', () => {
      key.classList.remove('is-down')
      hideTimer = window.setTimeout(() => key.classList.remove('is-shown'), 1100)
    }, true)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
  else mount()
}
