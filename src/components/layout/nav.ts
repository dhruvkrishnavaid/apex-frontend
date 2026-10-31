import { LayoutDashboard, type LucideIcon } from 'lucide-react'
import type { LinkProps } from '@tanstack/react-router'

export interface NavItem {
  label: string
  to: LinkProps['to']
  icon: LucideIcon
  /** Any one of these permissions makes the item visible. */
  permissions?: string[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
]
