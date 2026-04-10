import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with real Belle Désir products...');

  // 1. Create/Update Users
  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const userPassword = await bcrypt.hash('User1234!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@belledesir.com' },
    update: {},
    create: {
      email: 'admin@belledesir.com',
      name: 'Super Admin',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@belledesir.com' },
    update: {},
    create: {
      email: 'user@belledesir.com',
      name: 'John Doe',
      password: userPassword,
      role: Role.USER,
    },
  });

  // 2. Create/Update Categories
  const categoriesData = [
    { name: 'Vibradores', slug: 'vibradores', description: 'Juguetes vibradores de alta tecnología', imageUrl: 'https://via.placeholder.com/300?text=Vibradores' },
    { name: 'Lubricantes', slug: 'lubricantes', description: 'Lubricantes a base de agua y silicona', imageUrl: 'https://via.placeholder.com/300?text=Lubricantes' },
    { name: 'Parejas', slug: 'parejas', description: 'Juegos y accesorios para disfrutar en pareja', imageUrl: 'https://via.placeholder.com/300?text=Parejas' },
    { name: 'Wellness', slug: 'wellness', description: 'Aceites para masajes y salud íntima', imageUrl: 'https://via.placeholder.com/300?text=Wellness' },
  ];

  const categoryMap: Record<string, number> = {};

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
    categoryMap[cat.name] = createdCat.id;
  }

  // 3. Real Products Data
  const productsData = [
    {
      name: "Succionador De Clítoris Pulse Lite Neo Svakom Rosado",
      slug: "succionador-clitoris-pulse-lite-neo-svakom-rosado",
      sku: "GCJ4036R",
      price: 179800,
      comparePrice: 179900,
      stock: 1,
      description: "Succionador de clítoris premium Svakom con tecnología de pulso de aire. Diseño ergonómico, ultra silencioso, resistente al agua.",
      isFeatured: true,
      isActive: true,
      categoryName: "Vibradores"
    },
    {
      name: "Lubricante Retardante Ejaculation Delay Sen Intimo 15ml",
      slug: "lubricante-retardante-ejaculation-delay-sen-intimo-15ml",
      sku: "GCC174",
      price: 41400,
      comparePrice: 39795,
      stock: 2,
      description: "Lubricante retardante de fórmula suave para prolongar el placer. Base acuosa, compatible con preservativos.",
      isFeatured: false,
      isActive: true,
      categoryName: "Lubricantes"
    },
    {
      name: "Anillo Vibrador Thor",
      slug: "anillo-vibrador-thor",
      sku: "PR-07",
      price: 9800,
      comparePrice: null,
      stock: 3,
      description: "Anillo vibrador de silicona flexible. Estimulación para parejas, fácil de usar y limpiar.",
      isFeatured: false,
      isActive: true,
      categoryName: "Parejas"
    },
    {
      name: "Lubricante Caliente Caramelo Sen Intimo 30ml",
      slug: "lubricante-caliente-caramelo-sen-intimo-30ml",
      sku: "GCC181",
      price: 27800,
      comparePrice: 26145,
      stock: 1,
      description: "Lubricante íntimo con efecto calor y sabor a caramelo. Ideal para masajes y juegos de pareja.",
      isFeatured: false,
      isActive: true,
      categoryName: "Lubricantes"
    },
    {
      name: "Lubricante Caliente Chocolate Sen Intimo 30ml",
      slug: "lubricante-caliente-chocolate-sen-intimo-30ml",
      sku: "GCC182",
      price: 27800,
      comparePrice: 26145,
      stock: 2,
      description: "Lubricante íntimo con efecto calor y delicioso aroma a chocolate. Base acuosa, sin parabenos.",
      isFeatured: false,
      isActive: true,
      categoryName: "Lubricantes"
    },
    {
      name: "Ducha Anal Boxter Camtoyz",
      slug: "ducha-anal-boxter-camtoyz",
      sku: "CT-JEN-1097-BOXTER",
      price: 27800,
      comparePrice: 29900,
      stock: 2,
      description: "Ducha anal compacta para higiene íntima. Material seguro, fácil de usar y de limpieza sencilla.",
      isFeatured: false,
      isActive: true,
      categoryName: "Wellness"
    },
    {
      name: "Vibrador Discreto Lirio",
      slug: "vibrador-discreto-lirio",
      sku: "CT-JVB-163-LIRIO-ROS",
      price: 17800,
      comparePrice: null,
      stock: 2,
      description: "Vibrador compacto y discreto con forma de flor. Múltiples modos de vibración, silencioso e impermeable.",
      isFeatured: false,
      isActive: true,
      categoryName: "Vibradores"
    },
    {
      name: "Vibrador Hitachi Lunara Camtoyz",
      slug: "vibrador-hitachi-lunara-camtoyz",
      sku: "CT-JVB-165-LUNARA-LIL",
      price: 69800,
      comparePrice: 71185,
      stock: 1,
      description: "Potente masajeador personal estilo Hitachi. Motor de alta potencia, cabezal flexible, 10 modos de vibración.",
      isFeatured: true,
      isActive: true,
      categoryName: "Vibradores"
    },
    {
      name: "Brillo Labial Frutos Rojos Sen Intimo 20ml",
      slug: "brillo-labial-frutos-rojos-sen-intimo-20ml",
      sku: "GCC1233",
      price: 35000,
      comparePrice: 26145,
      stock: 2,
      description: "Brillo labial erótico con aroma y sabor a frutos rojos. Efecto suavizante y estimulante leve.",
      isFeatured: false,
      isActive: true,
      categoryName: "Wellness"
    },
    {
      name: "Lubricante Caliente Electrizante Crema De Whisky Sen Intimo 30ml",
      slug: "lubricante-caliente-electrizante-crema-whisky-sen-intimo-30ml",
      sku: "GCC1086",
      price: 41400,
      comparePrice: 40845,
      stock: 2,
      description: "Lubricante con doble efecto: calor y sensación electrizante suave. Aroma sofisticado a crema de whisky.",
      isFeatured: false,
      isActive: true,
      categoryName: "Lubricantes"
    },
    {
      name: "Crema Humectante De Feromonas 125ml Sen Intimo",
      slug: "crema-humectante-feromonas-125ml-sen-intimo",
      sku: "GCC1232",
      price: 33146,
      comparePrice: 31489,
      stock: 2,
      description: "Crema corporal humectante enriquecida con feromonas. Hidratación profunda y fragancia sensual duradera.",
      isFeatured: false,
      isActive: true,
      categoryName: "Wellness"
    },
    {
      name: "Lubricante Anal Desensibilizante Sen Intimo 10ml",
      slug: "lubricante-anal-desensibilizante-sen-intimo-10ml",
      sku: "GCC176",
      price: 27800,
      comparePrice: 24675,
      stock: 2,
      description: "Lubricante anal con agente desensibilizante suave para mayor comodidad. Fórmula de larga duración.",
      isFeatured: false,
      isActive: true,
      categoryName: "Lubricantes"
    },
    {
      name: "Lubricante Anal Desensibilizante Sen Intimo 30ml",
      slug: "lubricante-anal-desensibilizante-sen-intimo-30ml",
      sku: "GCC177",
      price: 39000,
      comparePrice: null,
      stock: 2,
      description: "Lubricante anal desensibilizante en presentación grande. Fórmula suave con efecto prolongado.",
      isFeatured: false,
      isActive: true,
      categoryName: "Lubricantes"
    },
    {
      name: "Lubricante Íntimo Vibrador Frequency Intense 15ml Elixir",
      slug: "lubricante-intimo-vibrador-frequency-intense-15ml-elixir",
      sku: "EX-CLV-6015-VIB-INTENSE",
      price: 43800,
      comparePrice: 49900,
      stock: 2,
      description: "Lubricante con efecto vibrante intenso. Estimulación potenciada para mayor sensibilidad en zonas íntimas.",
      isFeatured: true,
      isActive: true,
      categoryName: "Lubricantes"
    },
    {
      name: "Lubricante Íntimo 5 Sensaciones Elixir 30ml",
      slug: "lubricante-intimo-5-sensaciones-elixir-30ml",
      sku: "EX-CLV-6013-5SEN-30ML",
      price: 35800,
      comparePrice: 32900,
      stock: 2,
      description: "Lubricante multisensorial con 5 efectos en uno: calor, frío, vibración, sabor y deslizamiento premium.",
      isFeatured: false,
      isActive: true,
      categoryName: "Lubricantes"
    },
    {
      name: "Lubricante Íntimo Vibrador Frequency 15ml Elixir",
      slug: "lubricante-intimo-vibrador-frequency-15ml-elixir",
      sku: "EX-CLV-6011-VIB-15ML",
      price: 37800,
      comparePrice: 34900,
      stock: 2,
      description: "Lubricante con efecto vibrante suave. Fórmula base acuosa compatible con juguetes y preservativos.",
      isFeatured: false,
      isActive: true,
      categoryName: "Lubricantes"
    },
    {
      name: "Brillo Labial Magnetic Con Feromonas Elixir",
      slug: "brillo-labial-magnetic-feromonas-elixir",
      sku: "EX-CCM-6023-GLOSS",
      price: 25800,
      comparePrice: null,
      stock: 2,
      description: "Brillo labial potenciado con feromonas para aumentar el atractivo natural. Acabado glossy y efecto voluminizador.",
      isFeatured: false,
      isActive: true,
      categoryName: "Wellness"
    },
    {
      name: "Blow Pop Elixir Mora Azul",
      slug: "blow-pop-elixir-mora-azul",
      sku: "EX-CLV-009-BLOW-SUR-5GR-CJ24MO",
      price: 5200,
      comparePrice: 11990,
      stock: 4,
      description: "Caramelo oral erótico con efecto estimulante. Sabor mora azul, ideal como complemento íntimo.",
      isFeatured: false,
      isActive: true,
      categoryName: "Wellness"
    },
    {
      name: "Blow Pop Elixir Sandía",
      slug: "blow-pop-elixir-sandia",
      sku: "EX-CLV-009-BLOW-SUR-5GR-CJ24SA",
      price: 5200,
      comparePrice: null,
      stock: 4,
      description: "Caramelo oral erótico con efecto estimulante. Sabor sandía fresca, perfecto para momentos de intimidad.",
      isFeatured: false,
      isActive: true,
      categoryName: "Wellness"
    },
  ];

  for (const product of productsData) {
    const { categoryName, ...productData } = product;
    
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        comparePrice: productData.comparePrice,
        stock: productData.stock,
        sku: productData.sku,
        isFeatured: productData.isFeatured,
        isActive: productData.isActive,
        categoryId: categoryMap[categoryName],
      },
      create: {
        ...productData,
        images: [], // Real products images will be uploaded via admin panel
        categoryId: categoryMap[categoryName],
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
