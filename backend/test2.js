const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const { data } = await axios.get('https://pleasuresensual.com.co/collections/juguetes/products/vibrador-emma-neo-2-svakom');
    const $ = cheerio.load(data);
    
    console.log('\n--- ALL IMAGES ---');
    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('srcset');
      if (src && src.length > 5 && !src.includes('data:image')) {
        console.log(src.split(' ')[0]); // print first src in srcset
      }
    });

  } catch (e) {
    console.error(e.message);
  }
}
test();
