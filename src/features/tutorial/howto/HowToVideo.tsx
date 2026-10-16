import { clipPosterPath, clipVideoPath, type HowToClip } from '@/features/tutorial/howto/howtoClips'

interface HowToVideoProps {
  clip: HowToClip
  reduced: boolean
  loop: boolean
  onEnded: () => void
}

export function HowToVideo({ clip, reduced, loop, onEnded }: HowToVideoProps) {
  const base = import.meta.env.BASE_URL
  return (
    <div className="howto-video" data-clip={clip.name}>
      <video
        src={`${base}${clipVideoPath(clip.name)}`}
        poster={`${base}${clipPosterPath(clip.name)}`}
        aria-label={`Demonstração: ${clip.label}`}
        muted
        playsInline
        preload="auto"
        autoPlay={!reduced}
        controls={reduced}
        loop={loop}
        onEnded={onEnded}
      />
    </div>
  )
}
