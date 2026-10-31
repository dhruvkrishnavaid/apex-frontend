import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api } from './api'
import type { Alert, Category, Dashboard, Page, Product, SalesReport, TopProductRow } from './types'

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
