import { Badge } from '@/components/ui/badge'

const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CANCELLED: 'destructive',
  DELIVERED: 'default',
  RECEIVED: 'default',
  SHIPPED: 'default',
  PENDING: 'outline',
  DRAFT: 'outline',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={variants[status] ?? 'secondary'}>{status.replaceAll('_', ' ').toLowerCase()}</Badge>
}
