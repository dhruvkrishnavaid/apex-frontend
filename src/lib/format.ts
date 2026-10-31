const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat()

export const formatCurrency = (n: number | null | undefined) => currency.format(n ?? 0)
export const formatCompact = (n: number | null | undefined) => compact.format(n ?? 0)
export const formatNumber = (n: number | null | undefined) => integer.format(n ?? 0)
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
