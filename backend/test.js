const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('pleasure.html', 'utf8');
const $ = cheerio.load(html);

console.log("=== LINKS ENCONTRADOS ===");
const links = [];
$('a').each((i, el) => {
  const href = $(el).attr('href');
  if (href && href.includes('/products/')) {
    links.push({
      href,
      classes: $(el).attr('class'),
      text: $(el).text().trim()
    });
  }
});
console.log(links.slice(0, 5));

console.log("\n=== CLASSES EN ARTICLES O LIS ===");
$('article, li, div').each((i, el) => {
  const c = $(el).attr('class');
  if (c && c.includes('product')) {
    console.log(el.tagName, c);
  }
});
