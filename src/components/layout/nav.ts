import { LayoutDashboard, Package, Warehouse, Bell, ShoppingCart, Truck, Factory, Users, ScrollText, Contact, Building2, type LucideIcon } from 'lucide-react'
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
  {
    label: 'Catalogue',
    items: [{ label: 'Products', to: '/products', icon: Package, permissions: ['product:read'] }],
  },
  {
    label: 'Procurement',
    items: [
      { label: 'Purchase orders', to: '/purchase-orders', icon: Truck, permissions: ['purchase:read'] },
      { label: 'Suppliers', to: '/suppliers', icon: Factory, permissions: ['supplier:read'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Orders', to: '/orders', icon: ShoppingCart, permissions: ['order:read'] },
      { label: 'Customers', to: '/customers', icon: Contact, permissions: ['customer:read'] },
      { label: 'Inventory', to: '/inventory', icon: Warehouse, permissions: ['inventory:read'] },
      { label: 'Warehouses', to: '/warehouses', icon: Building2, permissions: ['warehouse:read'] },
      { label: 'Alerts', to: '/alerts', icon: Bell, permissions: ['alert:read'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users & roles', to: '/users', icon: Users, permissions: ['user:read'] },
      { label: 'Audit log', to: '/audit', icon: ScrollText, permissions: ['audit:read'] },
    ],
  },
]
