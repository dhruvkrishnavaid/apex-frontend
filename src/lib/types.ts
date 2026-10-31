export interface Page<T> {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  roleName: string
  permissions: string[]
  isActive: boolean
  mfaEnabled: boolean
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface Dashboard {
  activeProducts: number
  activeWarehouses: number
  totalUnitsOnHand: number
  stockCostValue: number
  openAlerts: number
  pendingOrders: number
  ordersToShip: number
  openPurchaseOrders: number
  ordersToday: number
  revenueToday: number
  generatedAt: string
}

export interface SalesDay {
  date: string
  orders: number
  units: number
  revenue: number
  grossProfit: number
}

export interface SalesReport {
  from: string
  to: string
  orders: number
  unitsSold: number
  revenue: number
  cost: number
  grossProfit: number
  refunds: number
  netRevenue: number
  days: SalesDay[]
}

export interface TopProductRow {
  variantId: string
  sku: string
  productName: string
  unitsSold: number
  revenue: number
}

export interface Alert {
  id: string
  variantId: string
  sku: string
  productName: string
  warehouseId: string
  warehouseCode: string
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | string
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | string
  availableQuantity: number
  reorderPoint: number
  createdAt: string
}

export interface Barcode {
  id: string
  barcode: string
  type: string
  isPrimary: boolean
}

export interface Variant {
  id: string
  productId: string
  sku: string
  variantAttributes: Record<string, unknown> | null
  costPrice: number
  retailPrice: number
  isActive: boolean
  barcodes: Barcode[]
}

export interface Product {
  id: string
  categoryId: string
  categoryName: string
  name: string
  slug: string
  description: string | null
  brand: string | null
  unitOfMeasure: string
  hasVariants: boolean
  isActive: boolean
  variants: Variant[]
  mediaUrls: string[]
  createdAt: string
}

export interface Category {
  id: string
  parentId: string | null
  name: string
  slug: string
  description: string | null
  isActive: boolean
  subcategories: Category[]
}

export interface StockLevel {
  id: string
  variantId: string
  sku: string
  productName: string
  warehouseId: string
  warehouseCode: string
  locationCode: string | null
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  updatedAt: string
}

export interface Warehouse {
  id: string
  code: string
  name: string
  city: string | null
  country: string | null
  contactPhone: string | null
  isActive: boolean
}

export interface Movement {
  id: string
  variantId: string
  sku: string
  warehouseId: string
  warehouseCode: string
  type: string
  quantityChange: number
  quantityAfter: number
  referenceType: string | null
  reason: string | null
  createdAt: string
}

export interface ReplenishmentSuggestion {
  variantId: string
  sku: string
  productName: string
  warehouseId: string
  warehouseCode: string
  availableQuantity: number
  reorderPoint: number
  suggestedQuantity: number
  preferredSupplierName: string | null
  estimatedUnitCost: number | null
}

export type OrderStatus = 'PENDING' | 'PICKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface OrderLine {
  id: string
  variantId: string
  sku: string
  productName: string
  quantity: number
  quantityPicked: number
  quantityReturned: number
  unitPrice: number
  discountPercent: number | null
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string | null
  warehouseCode: string
  status: OrderStatus
  channel: string | null
  shippingAddress: string | null
  notes: string | null
  subtotal: number
  taxAmount: number
  total: number
  carrier: string | null
  trackingNumber: string | null
  lines: OrderLine[]
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
}

export interface Supplier {
  id: string
  code: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  paymentTerms: string | null
  leadTimeDays: number | null
  isActive: boolean
}

export interface PoLine {
  id: string
  variantId: string
  sku: string
  productName: string
  quantityOrdered: number
  quantityReceived: number
  quantityOutstanding: number
  unitCost: number
  lineTotal: number
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierName: string
  warehouseCode: string
  status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED' | 'CLOSED'
  expectedDate: string | null
  notes: string | null
  totalAmount: number
  lines: PoLine[]
  orderedAt: string | null
  createdAt: string
}

export interface Role {
  id: string
  name: string
  permissions: string[]
  builtIn: boolean
  userCount: number
  createdAt: string
}

export interface AuditLog {
  id: string
  userEmail: string | null
  method: string
  path: string
  resource: string | null
  statusCode: number
  ipAddress: string | null
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  notes: string | null
  isActive: boolean
}

export type TransferStatus = 'REQUESTED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED'

export interface TransferLine {
  id: string
  variantId: string
  sku: string
  quantity: number
  receivedQuantity: number | null
}

export interface Transfer {
  id: string
  referenceNumber: string
  fromWarehouseCode: string
  toWarehouseCode: string
  status: TransferStatus
  notes: string | null
  lines: TransferLine[]
  dispatchedAt: string | null
  receivedAt: string | null
  createdAt: string
}

export interface ReorderRule {
  id: string
  variantId: string
  sku: string
  productName: string
  warehouseId: string
  warehouseCode: string
  reorderPoint: number
  reorderQuantity: number
  isActive: boolean
}

export interface OrderReturn {
  id: string
  returnNumber: string
  reason: string | null
  restocked: boolean
  refundAmount: number
  lines: { orderLineId: string; sku: string; quantity: number; refundAmount: number }[]
  createdAt: string
}
