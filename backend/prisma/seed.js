import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Seed Credit Packages
  const packages = [
    {
      name: 'Basic',
      price: 50000, // ₹500 in paise
      credits: 10,
      description: 'Perfect for getting started with property listings',
    },
    {
      name: 'Pro',
      price: 100000, // ₹1000 in paise
      credits: 25,
      description: 'Best value for regular property listings',
    },
    {
      name: 'Premium',
      price: 200000, // ₹2000 in paise
      credits: 50,
      description: 'Ultimate package for professional property agents',
    },
  ];

  for (const pkg of packages) {
    await prisma.creditPackage.upsert({
      where: { name: pkg.name },
      update: pkg,
      create: pkg,
    });
    console.log(`✓ Created/Updated ${pkg.name} package`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
