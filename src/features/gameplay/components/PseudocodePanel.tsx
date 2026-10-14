export function PseudocodePanel({ text, valid }: { text: string; valid: boolean }) {
  return (
    <figure className="pseudocode-panel">
      <figcaption>Gerado automaticamente a partir dos seus blocos.</figcaption>
      {valid ? (
        <pre className="pseudocode-panel__code">{text}</pre>
      ) : (
        <p className="pseudocode-panel__invalid">Complete os blocos destacados para ver o pseudocódigo.</p>
      )}
    </figure>
  )
}
