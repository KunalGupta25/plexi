'use client'

import { useSidebar } from '@/components/sidebar-context'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export function MainContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <main
      className={cn(
        'transition-all duration-300',
        'md:ml-64',
        collapsed && 'md:ml-16'
      )}
    >
      {children}
    </main>
  )
}
