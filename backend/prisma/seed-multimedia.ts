import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding multimedia content...');

  // Hero Background
  await prisma.multimediaContent.create({
    data: {
      title: 'Fondo Elegante Hero',
      alt: 'Textura de seda sensual púrpura',
      type: 'BACKGROUND',
      url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
      page: 'HOME',
      section: 'HERO_BACKGROUND',
      priority: 1,
      isActive: true,
      overlayOpacity: 0.4,
      size: 'cover',
      alignment: 'center'
    }
  });

  // Support Image for Nosotros
  await prisma.multimediaContent.create({
    data: {
      title: 'Imagen Apoyo Nosotros',
      alt: 'Pareja en ambiente romántico y elegante',
      type: 'SUPPORT',
      url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2070&auto=format&fit=crop',
      page: 'HOME',
      section: 'SUPPORT_1',
      priority: 1,
      isActive: true,
      size: 'cover',
      alignment: 'center'
    }
  });

  console.log('Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
