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
    let descriptionEl = $('.product-single__description, .product-description, .product__description').first();
    
    // Transformar <br> y <p> en saltos de línea reales para que no se vea todo pegado
    descriptionEl.find('br').replaceWith('\n');
    descriptionEl.find('p').append('\n\n');
    descriptionEl.find('li').prepend('• ').append('\n');
    
    let description = descriptionEl.text().trim();
    if (!description) description = 'Descripción no disponible.';

    // Extraer imágenes secundarias si existen
    const images: string[] = [];
    $('.product-single__thumbnails img, .product-gallery__image img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        if (src.startsWith('//')) src = 'https:' + src;
        // Quitar sufijos de Shopify como _800x o _1024x1024 pero de forma más segura
        src = src.replace(/_\d+x\d*(?=\.\w+(?:\?|$))/g, '');
        // A veces hay imágenes muy pequeñas como _50x50, quitar eso:
        src = src.replace(/_\d+x\d*([._])/g, '$1');
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
      const { data } = await axios.get(`${BASE_URL}${collection.url}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      const $ = cheerio.load(data);
      
      // Selectores típicos de Shopify para items de producto
      const productElements = $('.product-card--root').toArray();
      console.log(`Se encontraron ${productElements.length} productos en la página principal de la colección.`);

      // Procesar hasta 50 productos por colección para hacerlo masivo
      const limit = Math.min(productElements.length, 50);
      
      for (let i = 0; i < limit; i++) {
        const el = productElements[i];
        
        // Extraer link
        const link = $(el).find('a.product-card--title-link, a.product-card--image-wrapper').attr('href') || $(el).find('a').first().attr('href');
        if (!link) continue;
        
        const fullUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;
        
        // Extraer nombre
        let name = $(el).find('.product-card--title-link').text().trim();
        if (!name) name = $(el).find('.product-card--title').text().trim();
        if (!name) continue; // Si no hay nombre, saltar
        
        // Extraer precio - Buscamos primero si hay precio de oferta, sino el regular
        let priceEl = $(el).find('.price-item--sale').length ? $(el).find('.price-item--sale') : $(el).find('.price-item--regular');
        let priceText = priceEl.text().trim();
        if (!priceText) priceText = $(el).find('.product--price-wrapper').text().trim();
        
        // Limpiar el precio: Extraer solo la primera secuencia de números (ej. $100.000 COP $80.000 COP -> 100000)
        // Para evitar el overflow (10000080000), sacamos el primer número. Si está en oferta, a veces el menor es el último.
        // Mejor quitamos todo texto y nos quedamos con los últimos dígitos si están juntos, o partimos por el signo $.
        const rawPrices = priceText.split('$').map(s => s.replace(/[^\d]/g, '')).filter(Boolean);
        // Si hay varios precios (oferta), tomamos el último (que suele ser el de oferta)
        const finalPriceStr = rawPrices[rawPrices.length - 1] || '0';
        const price = parseFloat(finalPriceStr);
        
        // Extraer imagen principal
        let imageSrc = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
        if (imageSrc && imageSrc.startsWith('//')) {
          imageSrc = 'https:' + imageSrc;
        }
        // Limpiar sufijos de tamaño de Shopify
        if (imageSrc) {
           imageSrc = imageSrc.replace(/_[a-zA-Z0-9x]+(\.[a-zA-Z0-9]+)(\?.*)?$/, '$1');
        }

        console.log(`\n[${i+1}/${limit}] Procesando: ${name}`);
        console.log(`Precio extraído: ${price}`);

        // Scrapear detalles internos (descripción e imágenes extra)
        // Para evitar bans, esperamos 2 segundos entre peticiones
        await delay(2000);
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
              description: details.description,
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
      }

    } catch (error) {
      console.error(`Error scrapeando colección ${collection.name}:`, (error as Error).message);
    }
  }

  console.log('\n¡Scraping finalizado!');
  await prisma.$disconnect();
}

run();
