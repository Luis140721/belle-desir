import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
declare const process: any;

async function main() {
  console.log('Seeding database...');

  // Clean data (optional, un-comment if needed during reset)
  // await prisma.orderItem.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.cartItem.deleteMany();
  // await prisma.cart.deleteMany();
  // await prisma.review.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.user.deleteMany();

  // Create Users
  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const userPassword = await bcrypt.hash('User1234!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@belledesir.com' },
    update: {},
    create: {
      email: 'admin@belledesir.com',
      name: 'Super Admin',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@belledesir.com' },
    update: {},
    create: {
      email: 'user@belledesir.com',
      name: 'John Doe',
      password: userPassword,
      role: Role.USER,
    },
  });

  // Create Categories
  const categoriesData = [
    { name: 'Vibradores', slug: 'vibradores', description: 'Juguetes vibradores de alta tecnología', imageUrl: 'https://via.placeholder.com/300?text=Vibradores' },
    { name: 'Lencería', slug: 'lenceria', description: 'Conjuntos y prendas de lencería erótica premium', imageUrl: 'https://via.placeholder.com/300?text=Lenceria' },
    { name: 'Lubricantes', slug: 'lubricantes', description: 'Lubricantes a base de agua y silicona', imageUrl: 'https://via.placeholder.com/300?text=Lubricantes' },
    { name: 'Bondage', slug: 'bondage', description: 'Accesorios para iniciarse en BDSM ligero', imageUrl: 'https://via.placeholder.com/300?text=Bondage' },
    { name: 'Parejas', slug: 'parejas', description: 'Juegos y accesorios para disfrutar en pareja', imageUrl: 'https://via.placeholder.com/300?text=Parejas' },
    { name: 'Wellness', slug: 'wellness', description: 'Aceites para masajes y salud íntima', imageUrl: 'https://via.placeholder.com/300?text=Wellness' },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories.push(c);
  }

  // Create Products (12 products distributed in categories)
  const productsData = [
    { name: 'Vibrador Rabbit de Lujo', slug: 'vibrador-rabbit-de-lujo', description: 'Vibrador doble estimulación con orejitas flexibles.', price: 155000, stock: 10, images: ['https://via.placeholder.com/600x600?text=Rabbit+Lujo'], isFeatured: true, categoryId: categories[0].id },
    { name: 'Bala Vibradora Discreta', slug: 'bala-vibradora-discreta', description: 'Bala potente con 10 modos de vibración.', price: 45000, stock: 25, images: ['https://via.placeholder.com/600x600?text=Bala+Vibradora'], categoryId: categories[0].id },
    { name: 'Conjunto Lencería Encaje Negro', slug: 'lenceria-encaje-negro', description: 'Hermoso conjunto de dos piezas.', price: 85000, stock: 8, images: ['https://via.placeholder.com/600x600?text=Conjunto+Encaje'], isFeatured: true, categoryId: categories[1].id },
    { name: 'Bata de Satén', slug: 'bata-de-saten', description: 'Bata suave y elegante para momentos especiales.', price: 120000, stock: 5, images: ['https://via.placeholder.com/600x600?text=Bata+Saten'], categoryId: categories[1].id },
    { name: 'Lubricante Base Agua 100ml', slug: 'lubricante-base-agua', description: 'No pegajoso, seguro con juguetes.', price: 35000, stock: 50, images: ['https://via.placeholder.com/600x600?text=Lube+Agua'], categoryId: categories[2].id },
    { name: 'Lubricante Efecto Calor', slug: 'lubricante-efecto-calor', description: 'Ideal para masajes previos.', price: 42000, stock: 30, images: ['https://via.placeholder.com/600x600?text=Lube+Calor'], categoryId: categories[2].id },
    { name: 'Kit Inicial Bondage', slug: 'kit-inicial-bondage', description: 'Vendas para ojos y esposas de muñeca.', price: 65000, stock: 15, images: ['https://via.placeholder.com/600x600?text=Kit+Bondage'], categoryId: categories[3].id },
    { name: 'Antifaz de Seda', slug: 'antifaz-de-seda', description: 'Oscuridad total y suavidad.', price: 25000, stock: 40, images: ['https://via.placeholder.com/600x600?text=Antifaz+Seda'], categoryId: categories[3].id },
    { name: 'Juego de Dados Kamasutra', slug: 'dados-kamasutra', description: 'Diversión para calentar la noche.', price: 15000, stock: 60, images: ['https://via.placeholder.com/600x600?text=Dados+Kama'], categoryId: categories[4].id },
    { name: 'Anillo Vibrador para Parejas', slug: 'anillo-vibrador', description: 'Prolonga el placer y brinda doble estimulación.', price: 55000, stock: 20, images: ['https://via.placeholder.com/600x600?text=Anillo+Vib'], isFeatured: true, categoryId: categories[4].id },
    { name: 'Aceite de Masaje Relajante', slug: 'aceite-masaje-relajante', description: 'Aroma a lavanda y vainilla.', price: 48000, stock: 18, images: ['https://via.placeholder.com/600x600?text=Aceite+Masaje'], categoryId: categories[5].id },
    { name: 'Vela para Masajes', slug: 'vela-masajes', description: 'Cera que se convierte en aceite tibio.', price: 38000, stock: 22, images: ['https://via.placeholder.com/600x600?text=Vela+Masajes'], categoryId: categories[5].id },
  ];

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: prod,
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
