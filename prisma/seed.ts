import prisma from '../src/lib/prisma'

async function main() {
  console.log('Seeding products...')

  const products = [
    {
      id: '1',
      name: 'KENT EXCELL+',
      description: 'Experience pure and healthy drinking water with the KENT EXCELL+ RO Water Purifier. This advanced purification system features a 7-stage purification process combining RO + UV + UF + TDS Control technology to remove dissolved impurities, bacteria, viruses, and harmful chemicals while retaining essential minerals. With its computer-controlled operation and intelligent filter change alarm, the KENT EXCELL+ ensures you always have access to safe, mineral-balanced drinking water. The sleek wall-mount design saves counter space while delivering up to 15 litres per hour of purified water. Perfect for Indian and Australian water conditions with TDS levels up to 2000 ppm.',
      price: 1199,
      imageUrl: '/products/kent-excell.png',
      images: ['/products/kent-excell.png', '/products/kent-excell-1.png', '/products/kent-excell-2.png'],
      stock: 20,
      category: 'ro-purifiers',
      isBestSeller: true,
      manualUrl: '/manuals/kent-excell-plus-manual.pdf',
    },
    {
      id: '2',
      name: 'KENT STERLING STAR',
      description: 'The KENT Sterling Star represents the pinnacle of water purification technology with its 9-stage purification process. Combining RO + UV + UF + TDS Control + Alkaline + Copper technology, this premium purifier not only removes impurities but also enriches your water with essential minerals and copper. The alkaline enhancement raises pH levels for better hydration and antioxidant properties. The copper infusion provides natural immunity-boosting benefits as per Ayurvedic traditions. Features include a digital display, zero water wastage technology, and a 9-litre storage tank. Ideal for families seeking the healthiest possible drinking water with antimicrobial protection.',
      price: 1399,
      imageUrl: '/products/kent-sterling-star.png',
      images: ['/products/kent-sterling-star.png', '/products/kent-sterling-star-1.png', '/products/kent-sterling-star-2.png'],
      stock: 15,
      category: 'ro-purifiers',
      isBestSeller: true,
      manualUrl: '/manuals/kent-sterling-star-manual.pdf',
    },
    {
      id: '3',
      name: 'KANGEN LEVELUK JR IV',
      description: 'The Enagic Kangen Leveluk JR IV is a compact, powerful water ioniser that transforms ordinary tap water into hydrogen-rich, alkaline Kangen Water. Made in Japan with exceptional build quality, this unit features solid platinum-coated titanium electrode plates for superior electrolysis. Produces 4 types of water: Strong Kangen (pH 11.0), Kangen Water (pH 8.5-9.5), Clean Water (pH 7.0), and Acidic Water (pH 5.5-6.5). The built-in high-grade filter removes chlorine, sediment, and impurities before ionisation. Features include auto-cleaning, voice confirmation, and easy installation. Compact design perfect for smaller kitchens. Backed by a 3-year manufacturer warranty.',
      price: 4599,
      imageUrl: '/products/kangen-leveluk.png',
      images: ['/products/kangen-leveluk.png', '/products/kangen-leveluk-1.png', '/products/kangen-leveluk-2.png'],
      stock: 10,
      category: 'water-ionisers',
      isBestSeller: true,
      manualUrl: '/manuals/kangen-leveluk-jr-iv-manual.pdf',
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    })
    console.log(`✓ ${product.name}`)
  }

  console.log('\nSeeding testimonials...')

  const testimonials = [
    {
      id: '1',
      content: 'Our KENT RO purifier has been a game-changer! The water tastes so much better and the installation was quick and professional. Highly recommend!',
      rating: 5,
      authorName: 'Sarah Mitchell',
      authorAvatar: '/testimonials/sarah.jpg',
      isApproved: true,
    },
    {
      id: '2',
      content: "Best investment for our family's health. The team at Inblu helped us choose the perfect undersink filter for our Melbourne home. Excellent service!",
      rating: 5,
      authorName: 'James Chen',
      authorAvatar: '/testimonials/james.jpg',
      isApproved: true,
    },
    {
      id: '3',
      content: 'The Kangen water ioniser has transformed our drinking water. We love the alkaline water and the machine was installed same-day. Highly recommend Inblu!',
      rating: 5,
      authorName: 'Emma Thompson',
      authorAvatar: '/testimonials/emma.jpg',
      isApproved: true,
    },
  ]

  for (const testimonial of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: testimonial.id },
      update: testimonial,
      create: testimonial,
    })
    console.log(`✓ ${testimonial.authorName}`)
  }

  console.log('\nSeeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
