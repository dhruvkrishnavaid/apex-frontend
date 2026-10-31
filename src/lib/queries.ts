import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api } from './api'
import type { Alert, AuditLog, Category, Customer, Dashboard, Movement, Order, OrderReturn, Page, Product, PurchaseOrder, ReorderRule, ReplenishmentSuggestion, Role, SalesReport, StockLevel, Supplier, TopProductRow, Transfer, User, Warehouse } from './types'

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

export const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoDate(d)
}

export const dashboardQuery = queryOptions({
  queryKey: ['dashboard'],
  queryFn: () => api.get<Dashboard>('/dashboard'),
})

export const salesReportQuery = (from: string, to: string) =>
  queryOptions({
    queryKey: ['reports', 'sales', from, to],
    queryFn: () => api.get<SalesReport>('/reports/sales', { from, to }),
  })

export const topProductsQuery = (from: string, to: string, limit = 5) =>
  queryOptions({
    queryKey: ['reports', 'top-products', from, to, limit],
    queryFn: () => api.get<TopProductRow[]>('/reports/top-products', { from, to, limit }),
  })

export const openAlertsQuery = (size = 5) =>
  queryOptions({
    queryKey: ['alerts', 'open', size],
    queryFn: () => api.get<Page<Alert>>('/alerts', { status: 'OPEN', size }),
  })

export const categoriesQuery = queryOptions({
  queryKey: ['categories'],
  queryFn: () => api.get<Category[]>('/categories'),
  staleTime: 5 * 60_000,
})

export const productsQuery = (params: { page: number; keyword?: string; categoryId?: string }) =>
  queryOptions({
    queryKey: ['products', params],
    queryFn: () =>
      api.get<Page<Product>>('/products', {
        page: params.page,
        size: 20,
        keyword: params.keyword,
        categoryId: params.categoryId,
      }),
    placeholderData: keepPreviousData,
  })

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ['products', id],
    queryFn: () => api.get<Product>(`/products/${id}`),
  })

export const warehousesQuery = queryOptions({
  queryKey: ['warehouses'],
  queryFn: () => api.get<Page<Warehouse>>('/warehouses', { size: 100 }),
  staleTime: 5 * 60_000,
})

export const stockQuery = (params: { page: number; warehouseId?: string; inStockOnly?: boolean }) =>
  queryOptions({
    queryKey: ['inventory', 'stock', params],
    queryFn: () => api.get<Page<StockLevel>>('/inventory', { size: 20, ...params }),
    placeholderData: keepPreviousData,
  })

export const movementsQuery = (params: { page: number; warehouseId?: string }) =>
  queryOptions({
    queryKey: ['inventory', 'movements', params],
    queryFn: () => api.get<Page<Movement>>('/inventory/movements', { size: 20, sort: 'createdAt,desc', ...params }),
    placeholderData: keepPreviousData,
  })

export const alertsQuery = (params: { page: number; status?: string }) =>
  queryOptions({
    queryKey: ['alerts', 'list', params],
    queryFn: () => api.get<Page<Alert>>('/alerts', { size: 20, ...params }),
    placeholderData: keepPreviousData,
  })

export const suggestionsQuery = queryOptions({
  queryKey: ['alerts', 'suggestions'],
  queryFn: () => api.get<ReplenishmentSuggestion[]>('/reorder-rules/suggestions'),
})

export const ordersQuery = (params: { page: number; status?: string; orderNumber?: string }) =>
  queryOptions({
    queryKey: ['orders', 'list', params],
    queryFn: () => api.get<Page<Order>>('/orders', { size: 20, sort: 'createdAt,desc', ...params }),
    placeholderData: keepPreviousData,
  })

export const orderQuery = (id: string) =>
  queryOptions({ queryKey: ['orders', id], queryFn: () => api.get<Order>(`/orders/${id}`) })

export const suppliersQuery = (params: { page: number; keyword?: string }) =>
  queryOptions({
    queryKey: ['suppliers', params],
    queryFn: () => api.get<Page<Supplier>>('/suppliers', { size: 20, ...params }),
    placeholderData: keepPreviousData,
  })

export const purchaseOrdersQuery = (params: { page: number; status?: string }) =>
  queryOptions({
    queryKey: ['purchase-orders', 'list', params],
    queryFn: () => api.get<Page<PurchaseOrder>>('/purchase-orders', { size: 20, sort: 'createdAt,desc', ...params }),
    placeholderData: keepPreviousData,
  })

export const purchaseOrderQuery = (id: string) =>
  queryOptions({ queryKey: ['purchase-orders', id], queryFn: () => api.get<PurchaseOrder>(`/purchase-orders/${id}`) })

export const usersQuery = (page: number) =>
  queryOptions({
    queryKey: ['users', page],
    queryFn: () => api.get<Page<User>>('/users', { size: 20, page }),
    placeholderData: keepPreviousData,
  })

export const rolesQuery = queryOptions({
  queryKey: ['roles'],
  queryFn: () => api.get<Role[]>('/roles'),
})

export const auditLogsQuery = (params: { page: number; method?: string }) =>
  queryOptions({
    queryKey: ['audit-logs', params],
    queryFn: () => api.get<Page<AuditLog>>('/audit-logs', { size: 25, sort: 'createdAt,desc', ...params }),
    placeholderData: keepPreviousData,
  })

export const customersListQuery = (params: { page: number; keyword?: string }) =>
  queryOptions({
    queryKey: ['customers', 'list', params],
    queryFn: () => api.get<Page<Customer>>('/customers', { size: 20, sort: 'name,asc', ...params }),
    placeholderData: keepPreviousData,
  })

export const customersQuery = queryOptions({
  queryKey: ['customers'],
  queryFn: () => api.get<Page<Customer>>('/customers', { size: 100, sort: 'name,asc' }),
})

export const supplierOptionsQuery = queryOptions({
  queryKey: ['suppliers', 'options'],
  queryFn: () => api.get<Page<Supplier>>('/suppliers', { size: 100, active: true, sort: 'name,asc' }),
})

export const transfersQuery = (params: { page: number; status?: string }) =>
  queryOptions({
    queryKey: ['transfers', 'list', params],
    queryFn: () => api.get<Page<Transfer>>('/transfers', { size: 20, sort: 'createdAt,desc', ...params }),
    placeholderData: keepPreviousData,
  })

export const transferQuery = (id: string) =>
  queryOptions({ queryKey: ['transfers', id], queryFn: () => api.get<Transfer>(`/transfers/${id}`) })

export const reorderRulesQuery = queryOptions({
  queryKey: ['reorder-rules'],
  queryFn: () => api.get<ReorderRule[]>('/reorder-rules'),
})

export const permissionsQuery = queryOptions({
  queryKey: ['roles', 'permissions'],
  queryFn: () => api.get<string[]>('/roles/permissions'),
  staleTime: 10 * 60_000,
})

export const orderReturnsQuery = (orderId: string) =>
  queryOptions({
    queryKey: ['orders', orderId, 'returns'],
    queryFn: () => api.get<OrderReturn[]>(`/orders/${orderId}/returns`),
  })
