import { useEffect, useMemo, useRef } from 'react'
import { useLocation, useRoutes } from 'react-router'
import { AnimatePresence, motion, type TargetAndTransition, type Variants } from 'motion/react'
import { appRoutes } from '@/app/routes'
import { transitionFor } from '@/app/routeTransitions'
import { pageVariants, type PageTransitionKind } from '@/motion/presets'

const routeVariants: Variants = {
  initial: (kind: PageTransitionKind) => pageVariants[kind].initial as TargetAndTransition,
  animate: (kind: PageTransitionKind) => pageVariants[kind].animate as TargetAndTransition,
  exit: (kind: PageTransitionKind) => pageVariants[kind].exit as TargetAndTransition,
}

export function AnimatedRoutes() {
  const location = useLocation()
  const element = useRoutes(appRoutes, location)
  const previous = useRef(location.pathname)
  const kind = useMemo(() => transitionFor(previous.current, location.pathname), [location.pathname])

  useEffect(() => {
    previous.current = location.pathname
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait" initial={false} custom={kind}>
      <motion.div key={location.pathname} className="page-transition" custom={kind} variants={routeVariants} initial="initial" animate="animate" exit="exit">
        {element}
      </motion.div>
    </AnimatePresence>
  )
}
