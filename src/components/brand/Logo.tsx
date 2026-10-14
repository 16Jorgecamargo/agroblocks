import './Logo.css'

export function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <span className={`logo logo--${size}`}>
      <svg className="logo__leaf" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 20C4 10 10 4 21 3c0 11-6 17-17 17z" fill="#5cbf4f" />
        <path d="M4 20L15 9" stroke="#1f5a2c" strokeWidth="1.6" fill="none" />
      </svg>
      <span className="logo__text">AgroBlocks</span>
    </span>
  )
}
