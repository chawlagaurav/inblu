/**
 * Helpers for resolving a product's category slug to a human-readable label.
 *
 * Products store category slugs in `category` (legacy single) and `categories[]`.
 * Slugs can drift over time — a category may be renamed, or stale slugs may
 * remain on old product rows. To keep the storefront clean we always render
 * via the canonical Category list and silently skip slugs that no longer
 * exist.
 */

import type { CategoryItem } from '@/lib/db/products'

/**
 * Build a fast slug → label lookup from the canonical category list.
 */
export function buildCategoryLabelMap(
  categories: Pick<CategoryItem, 'value' | 'label'>[]
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const c of categories) {
    map[c.value.toLowerCase()] = c.label
  }
  return map
}

/**
 * Resolve a product's primary display category to a label. Prefers the first
 * slug that maps to a known category; falls back to null if none of the
 * product's slugs are recognised (so the badge can be hidden rather than
 * leaking a stale slug like "ro-purifier").
 */
export function resolveProductCategoryLabel(
  product: { category?: string | null; categories?: string[] | null },
  labelMap: Record<string, string>
): string | null {
  const candidates: string[] = []
  if (product.category) candidates.push(product.category)
  if (product.categories) candidates.push(...product.categories)

  for (const slug of candidates) {
    const label = labelMap[slug.toLowerCase()]
    if (label) return label
  }
  return null
}
