/**
 * Rewrite stale category slugs on product rows.
 *
 * Some products were tagged with category slugs that no longer exist in the
 * Category master table (e.g. "ro-purifier" instead of "ro-purifiers").
 * Those slugs leak to the storefront as raw text. This script normalises them
 * by rewriting both the legacy single `category` field and the `categories[]`
 * array.
 *
 * Run:
 *   npx tsx scripts/fix-stale-category-slugs.ts            # dry run, prints changes
 *   npx tsx scripts/fix-stale-category-slugs.ts --apply    # writes to the DB
 *
 * Edit the SLUG_REWRITES map below to add more renames as needed.
 */

import prisma from '../src/lib/prisma'

// stale slug -> canonical slug. Add more entries here when categories get renamed.
const SLUG_REWRITES: Record<string, string> = {
  'ro-purifier': 'ro-purifiers',
}

const APPLY = process.argv.includes('--apply')

function rewriteSlug(slug: string | null | undefined): string | null {
  if (!slug) return slug ?? null
  return SLUG_REWRITES[slug] ?? slug
}

function rewriteSlugList(slugs: string[]): { next: string[]; changed: boolean } {
  const next: string[] = []
  let changed = false
  for (const s of slugs) {
    const r = SLUG_REWRITES[s] ?? s
    if (r !== s) changed = true
    // de-dup so rewriting "ro-purifier" -> "ro-purifiers" doesn't leave it twice
    if (!next.includes(r)) next.push(r)
    else changed = true
  }
  return { next, changed }
}

async function main() {
  const staleSlugs = Object.keys(SLUG_REWRITES)
  if (staleSlugs.length === 0) {
    console.log('No rewrites configured. Edit SLUG_REWRITES and re-run.')
    return
  }

  console.log(
    `${APPLY ? 'APPLYING' : 'DRY RUN —'} rewrites: ${JSON.stringify(SLUG_REWRITES)}`
  )

  // Pull every product whose category OR categories[] contains a stale slug.
  const candidates = await prisma.product.findMany({
    where: {
      OR: [
        { category: { in: staleSlugs } },
        { categories: { hasSome: staleSlugs } },
      ],
    },
    select: {
      id: true,
      name: true,
      category: true,
      categories: true,
    },
  })

  if (candidates.length === 0) {
    console.log('No products with stale category slugs found.')
    return
  }

  console.log(`Found ${candidates.length} product(s) to update:\n`)

  let updated = 0
  for (const p of candidates) {
    const newCategory = rewriteSlug(p.category) ?? p.category
    const { next: newCategories, changed: arrChanged } = rewriteSlugList(p.categories ?? [])
    const catChanged = newCategory !== p.category

    if (!catChanged && !arrChanged) continue

    console.log(`• ${p.name} (${p.id})`)
    if (catChanged) console.log(`    category:    ${p.category} -> ${newCategory}`)
    if (arrChanged) {
      console.log(`    categories:  [${p.categories.join(', ')}] -> [${newCategories.join(', ')}]`)
    }

    if (APPLY) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          category: newCategory,
          categories: newCategories,
        },
      })
      updated++
    }
  }

  console.log(
    `\n${APPLY ? `Updated ${updated} product(s).` : `Dry run complete — re-run with --apply to write changes.`}`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
