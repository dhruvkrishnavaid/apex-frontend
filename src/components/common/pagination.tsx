import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Page } from '#/lib/types'

export function Pagination({ page, onChange }: { page: Page<unknown>['page'] | undefined; onChange: (n: number) => void }) {
  if (!page || page.totalPages <= 1) return null
  const from = page.number * page.size + 1
  const to = Math.min((page.number + 1) * page.size, page.totalElements)
  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm text-muted-foreground">
      <p>
        {from}–{to} of {page.totalElements}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page.number === 0} onClick={() => onChange(page.number - 1)}>
          <ChevronLeft /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page.number + 1 >= page.totalPages} onClick={() => onChange(page.number + 1)}>
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
