import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = 'https://pleasuresensual.com.co';
const COLLECTIONS_TO_SCRAPE = [
  { url: '/collections/juguetes', name: 'Juguetes', slug: 'juguetes' },
  { url: '/collections/lenceria', name: 'Lencería', slug: 'lenceria' },
  { url: '/collections/lubricantes', name: 'Lubricantes', slug: 'lubricantes' }
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function scrapeProductDetails(productUrl: string) {
  try {
    console.log(`  Scraping detalles: ${productUrl}`);
    const { data } = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const $ = cheerio.load(data);
    
    // Extraer descripción
    let descriptionEl = $('.product-single__description, .product-description, .product__description, .product--block--description').first();
    if (!descriptionEl.length) {
      // Intentar encontrar cualquier div de descripción
      descriptionEl = $('[class*="desc"]').filter((i, el) => $(el).text().trim().length > 50).first();
    }
    
    // Transformar <br> y <p> en saltos de línea reales para que no se vea todo pegado
    descriptionEl.find('br').replaceWith('\n');
    descriptionEl.find('p').append('\n\n');
    descriptionEl.find('li').prepend('• ').append('\n');
    
    let description = descriptionEl.text().trim();
    if (!description) description = 'Descripción no disponible.';

    // Extraer imágenes secundarias si existen
    const images: string[] = [];
    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('srcset');
      if (src && src.includes('cdn.shopify') && !src.includes('data:image')) {
        src = src.split(' ')[0]; // si es srcset, tomar el primero
        if (src.startsWith('//')) src = 'https:' + src;
        // Quitar parámetros de width para mejor resolución
        src = src.replace(/&width=\d+/g, '');
        // Quitar sufijos _100x100 de forma segura solo al final antes del punto
        src = src.replace(/_\d+x\d*(?=\.\w+(?:\?|$))/g, '');
        if (!images.includes(src)) images.push(src);
      }
    });

    return { description, additionalImages: images };
  } catch (error) {
    console.error(`  Error scrapeando detalles de ${productUrl}:`, (error as Error).message);
    return { description: '<p>Descripción no disponible.</p>', additionalImages: [] };
  }
}

async function run() {
  console.log('Iniciando script de web scraping masivo...');

  console.log('Limpiando base de datos (Eliminando productos y categorías anteriores)...');
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  console.log('Base de datos limpia.');

  for (const collection of COLLECTIONS_TO_SCRAPE) {
    console.log(`\n===========================================`);
    console.log(`Procesando colección: ${collection.name}`);
    console.log(`===========================================`);

    // 1. Asegurar que la categoría existe en la DB
    let category = await prisma.category.findUnique({ where: { slug: collection.slug } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: collection.name,
          slug: collection.slug,
          description: `Catálogo de ${collection.name}`,
          imageUrl: 'https://via.placeholder.com/800x600?text=' + collection.name
        }
      });
      console.log(`Categoría creada: ${collection.name}`);
    } else {
      console.log(`Categoría existente: ${collection.name}`);
    }

    try {
      let page = 1;
      let totalScrapedCategory = 0;
      let hasMore = true;

      while (hasMore && totalScrapedCategory < 100) {
        console.log(`\n-- Extrayendo página ${page} de ${collection.name} --`);
        const { data } = await axios.get(`${BASE_URL}${collection.url}?page=${page}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });
        const $ = cheerio.load(data);
        
        // Selectores típicos de Shopify para items de producto
        const productElements = $('.product-card--root').toArray();
        console.log(`Se encontraron ${productElements.length} productos en la página ${page}.`);

        if (productElements.length === 0) {
          hasMore = false;
          break;
        }

        for (let i = 0; i < productElements.length; i++) {
          if (totalScrapedCategory >= 100) break;

          const el = productElements[i];
          
          // Extraer link
          const link = $(el).find('a.product-card--title-link, a.product-card--image-wrapper').attr('href') || $(el).find('a').first().attr('href');
          if (!link) continue;
          
          const fullUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;
          
          // Extraer nombre
          let name = $(el).find('.product-card--title-link').text().trim();
          if (!name) name = $(el).find('.product-card--title').text().trim();
          if (!name) continue; // Si no hay nombre, saltar

          // Revisar si ya existe en la BD para no duplicar (por recomendados o cross-selling)
          const exists = await prisma.product.findFirst({ where: { name } });
          if (exists) {
            console.log(`(Omitido) El producto ya existe: ${name}`);
            continue;
          }
          
          // Extraer precio
          let priceEl = $(el).find('.price-item--sale').length ? $(el).find('.price-item--sale') : $(el).find('.price-item--regular');
          let priceText = priceEl.text().trim();
          if (!priceText) priceText = $(el).find('.product--price-wrapper').text().trim();
          
          const rawPrices = priceText.split('$').map(s => s.replace(/[^\d]/g, '')).filter(Boolean);
          const finalPriceStr = rawPrices[rawPrices.length - 1] || '0';
          const price = parseFloat(finalPriceStr);
          
          // Extraer imagen principal
          let imageSrc = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
          if (imageSrc && imageSrc.startsWith('//')) {
            imageSrc = 'https:' + imageSrc;
          }
          if (imageSrc) {
             imageSrc = imageSrc.replace(/&width=\d+/g, '');
             imageSrc = imageSrc.replace(/_\d+x\d*(?=\.\w+(?:\?|$))/g, '');
          }

          console.log(`\n[+] Procesando: ${name}`);
          console.log(`Precio extraído: ${price}`);

          // Scrapear detalles internos (descripción e imágenes extra)
          // 800ms para acelerar el proceso pero no quemar el servidor
          await delay(800);
          const details = await scrapeProductDetails(fullUrl);
        
        const images = [imageSrc].filter(Boolean) as string[];
        // Agregar imagenes adicionales sin duplicar
        details.additionalImages.forEach(img => {
          if (!images.includes(img)) images.push(img);
        });

        const slug = slugify(name) + '-' + Math.floor(Math.random() * 1000);

        // Guardar en la base de datos
        try {
          await prisma.product.create({
            data: {
              name,
              slug,
              description: details.description.replace(/(\s*\n\s*)+/g, '\n').replace(/\n/g, '\n\n').trim(),
              price,
              stock: 10, // Stock por defecto
              isActive: true,
              isFeatured: i < 3, // Los primeros 3 destacados
              categoryId: category.id,
              images
            }
          });
          console.log(`✅ Guardado en DB: ${name}`);
        } catch (dbError) {
          console.error(`❌ Error guardando ${name} en DB:`, (dbError as Error).message);
        }
          totalScrapedCategory++;
        }
        page++;
      }

    } catch (error) {
      console.error(`Error scrapeando colección ${collection.name}:`, (error as Error).message);
    }
  }

  console.log('\n¡Scraping finalizado!');
  await prisma.$disconnect();
}

run();
