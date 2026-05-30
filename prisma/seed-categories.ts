import prisma from '../src/lib/prisma'

async function main() {
  console.log('Seeding categories...')

  const categories = [
    {
      value: 'ro-purifiers',
      label: 'Counter Top Filters',
      description: 'Advanced reverse osmosis purification',
      imageUrl: 'https://res.cloudinary.com/dlnt5kqmh/image/upload/v1778130939/inblu/categories/counter-top-filters.png',
      displayOrder: 1,
      isActive: true,
    },
    {
      value: 'water-ionisers',
      label: 'Water Ionisers',
      description: 'Alkaline antioxidant water systems',
      imageUrl: 'https://res.cloudinary.com/dlnt5kqmh/image/upload/v1778059847/inblu/categories/water-ionisers.png',
      displayOrder: 2,
      isActive: true,
    },
    {
      value: 'undersink-filters',
      label: 'Undersink Filters',
      description: 'Space-saving filtration solutions',
      imageUrl: 'https://res.cloudinary.com/dlnt5kqmh/image/upload/v1778059843/inblu/categories/undersink-filters.png',
      displayOrder: 3,
      isActive: true,
    },
  ]

  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { value: category.value },
      update: {
        label: category.label,
        description: category.description,
        imageUrl: category.imageUrl,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      },
      create: category,
    })
    console.log(`✓ ${result.label} (${result.value})`)
  }

  console.log('\nCategories seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
