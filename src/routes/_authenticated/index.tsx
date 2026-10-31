import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Banknote, Boxes, ClipboardList, Package, ShoppingCart, Truck, Warehouse } from 'lucide-react'
import { PageHeader } from '#/components/common/page-header'
import { StatCard } from '#/components/common/stat-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '#/auth'
import { dashboardQuery, daysAgo, openAlertsQuery, salesReportQuery, topProductsQuery } from '#/lib/queries'
import { formatCompact, formatCurrency, formatNumber } from '#/lib/format'

export const Route = createFileRoute('/_authenticated/')({ component: Dashboard })

function Dashboard() {
  const { user, can } = useAuth()
  const canReport = can('report:read')
  const canAlerts = can('alert:read')

  if (!canReport) {
    return (
      <>
        <PageHeader title={`Welcome, ${user?.firstName}`} description="Pick a section from the navigation to get started." />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${user?.firstName}. Here is how the business looks right now.`} />
      <Kpis />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SalesTrend />
        <TopProducts />
      </div>
      {canAlerts && <OpenAlerts />}
    </>
  )
}

function Kpis() {
  const { data, isPending } = useQuery(dashboardQuery)
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard loading={isPending} label="Revenue today" value={formatCurrency(data?.revenueToday)} hint={`${formatNumber(data?.ordersToday)} orders`} icon={Banknote} />
      <StatCard loading={isPending} label="Stock value (cost)" value={formatCurrency(data?.stockCostValue)} hint={`${formatCompact(data?.totalUnitsOnHand)} units on hand`} icon={Boxes} />
      <StatCard loading={isPending} label="Orders to ship" value={formatNumber(data?.ordersToShip)} hint={`${formatNumber(data?.pendingOrders)} pending`} icon={ShoppingCart} />
      <StatCard loading={isPending} label="Open alerts" value={formatNumber(data?.openAlerts)} icon={AlertTriangle} />
      <StatCard loading={isPending} label="Active products" value={formatNumber(data?.activeProducts)} icon={Package} />
      <StatCard loading={isPending} label="Warehouses" value={formatNumber(data?.activeWarehouses)} icon={Warehouse} />
      <StatCard loading={isPending} label="Open purchase orders" value={formatNumber(data?.openPurchaseOrders)} icon={Truck} />
      <StatCard loading={isPending} label="Pending orders" value={formatNumber(data?.pendingOrders)} icon={ClipboardList} />
    </div>
  )
}

function SalesTrend() {
  const from = daysAgo(13)
  const to = daysAgo(0)
  const { data, isPending } = useQuery(salesReportQuery(from, to))
  const days = data?.days ?? []
  const max = Math.max(1, ...days.map((d) => d.revenue))

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Revenue, last 14 days</CardTitle>
        <CardDescription>
          {data ? `${formatCurrency(data.netRevenue)} net across ${formatNumber(data.orders)} orders` : 'Loading…'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-48 w-full" />
        ) : days.length === 0 ? (
          <p className="grid h-48 place-items-center text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Daily revenue bar chart">
            {days.map((d) => (
              <div key={d.date} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                  style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }}
                  title={`${d.date}: ${formatCurrency(d.revenue)}`}
                />
                <span className="mt-1 hidden text-center text-[10px] text-muted-foreground sm:block">{d.date.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TopProducts() {
  const { data, isPending } = useQuery(topProductsQuery(daysAgo(29), daysAgo(0)))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>Last 30 days by units sold</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">No sales yet.</p>
        ) : (
          <ol className="space-y-3">
            {data.map((p, i) => (
              <li key={p.variantId} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.productName}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <div className="text-right text-sm tabular-nums">
                  <p className="font-medium">{formatNumber(p.unitsSold)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(p.revenue)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function OpenAlerts() {
  const { data, isPending } = useQuery(openAlertsQuery(5))
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Open alerts</CardTitle>
        <CardDescription>Stock that needs attention</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : !data?.content.length ? (
          <p className="text-sm text-muted-foreground">All clear, no open alerts.</p>
        ) : (
          <ul className="divide-y">
            {data.content.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <Badge variant={a.type === 'OUT_OF_STOCK' ? 'destructive' : 'secondary'}>
                  {a.type === 'OUT_OF_STOCK' ? 'Out of stock' : 'Low stock'}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.productName}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {a.sku} · {a.warehouseCode}
                  </p>
                </div>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {a.availableQuantity} / {a.reorderPoint}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

