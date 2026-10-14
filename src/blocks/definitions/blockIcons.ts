function svg(paths: string): string {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`
}

export const BLOCK_ICONS = {
  play: svg('<path d="M7 4l12 8-12 8z" fill="white"/>'),
  forward: svg('<path d="M12 20V5"/><path d="M5 11l7-7 7 7"/>'),
  turnLeft: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  turnRight: svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
  prepare: svg('<path d="M4 20h16"/><path d="M7 20l3-8h4l3 8"/><path d="M12 12V4"/>'),
  seed: svg('<path d="M12 21V11"/><path d="M12 11c0-4 3-7 7-7 0 4-3 7-7 7z"/><path d="M12 14c0-3-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5z"/>'),
  water: svg('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'),
  harvest: svg('<path d="M4 10h16l-2 10H6z"/><path d="M8 10l4-6 4 6"/>'),
  collect: svg('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V5h8v3"/><path d="M12 12v5"/><path d="M9.5 14.5L12 17l2.5-2.5"/>'),
}
