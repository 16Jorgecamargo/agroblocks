import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { motion, type HTMLMotionProps } from 'motion/react'
import { Icon, type IconName } from '@/components/icons/Icon'
import { PRESSABLE } from '@/motion/presets'

export type ButtonTone = 'primary' | 'secondary' | 'danger' | 'accent' | 'ghost' | 'dark'

type GameButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  tone?: ButtonTone
  size?: 'md' | 'lg'
  icon?: IconName
  children?: ReactNode
}

function classes(tone: ButtonTone, size: 'md' | 'lg', extra: string): string {
  return `game-button game-button--${tone} game-button--${size} ${extra}`.trim()
}

export function GameButton({ tone = 'secondary', size = 'md', icon, className = '', type = 'button', children, ...rest }: GameButtonProps) {
  return (
    <motion.button type={type} className={classes(tone, size, className)} {...PRESSABLE} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
      {children !== undefined && <span className="game-button__label">{children}</span>}
    </motion.button>
  )
}

const MotionLink = motion.create(Link)

interface GameLinkProps {
  to: string
  tone?: ButtonTone
  size?: 'md' | 'lg'
  icon?: IconName
  className?: string
  children?: ReactNode
  onClick?: () => void
}

export function GameLink({ to, tone = 'secondary', size = 'md', icon, className = '', children, onClick }: GameLinkProps) {
  return (
    <MotionLink to={to} className={classes(tone, size, className)} onClick={onClick} {...PRESSABLE}>
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
      {children !== undefined && <span className="game-button__label">{children}</span>}
    </MotionLink>
  )
}
