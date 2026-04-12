'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'

interface MotionWrapperProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
}

export function FadeIn({ children, ...props }: MotionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FadeInStagger({ children, ...props }: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function FadeInStaggerItem({ children, ...props }: MotionWrapperProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
