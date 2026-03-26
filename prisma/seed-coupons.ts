const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const coupons = await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        description: 'Welcome discount - 10% off',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 50,
        maxDiscountAmount: 100,
        isActive: true,
      },
      {
        code: 'FLAT25',
        description: 'Flat $25 off your order',
        discountType: 'fixed',
        discountValue: 25,
        minOrderAmount: 100,
        isActive: true,
      },
      {
        code: 'CLEANWATER10',
        description: 'Newsletter subscriber discount',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscountAmount: 50,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log('Coupons created:', coupons.count);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
