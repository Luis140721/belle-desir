import { SiteMedia } from '../types/index.js';
import { buildMediaUrl } from '../config/api.js';
import { getSiteMedia, groupSiteMedia } from '../services/siteMediaService.js';

function escapeHtml(value: string | null | undefined): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCssUrl(value: string): string {
  return buildMediaUrl(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function renderMediaFrame(item: SiteMedia): string {
  const title = escapeHtml(item.title);
  const alt = escapeHtml(item.altText || item.title);
  const mediaUrl = buildMediaUrl(item.url);

  if (item.type === 'IMAGE') {
    return `
      <div
        class="site-media-asset site-media-image"
        role="img"
        aria-label="${alt}"
        style="--site-media-image: url(&quot;${escapeCssUrl(item.url)}&quot;);">
      </div>
    `;
  }

  return `
    <video
      class="site-media-asset"
      src="${escapeHtml(mediaUrl)}"
      ${item.posterUrl ? `poster="${escapeHtml(buildMediaUrl(item.posterUrl))}"` : ''}
      title="${title}"
      controls
      playsinline
      preload="metadata">
    </video>
  `;
}

function renderSupportSection(item: SiteMedia, tone: string): string {
  return `
    <section class="site-media-section site-media-section--${tone}" aria-label="${escapeHtml(item.title)}">
      <div class="site-media-copy">
        <p class="site-media-eyebrow">Belle Desir visual</p>
        <h3>${escapeHtml(item.title)}</h3>
        ${item.subtitle ? `<p>${escapeHtml(item.subtitle)}</p>` : ''}
      </div>
      <div class="site-media-frame">
        ${renderMediaFrame(item)}
      </div>
    </section>
  `;
}

function applyHeroMedia(item: SiteMedia): void {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return;

  const existingCard = hero.querySelector('.hero-site-media-card');
  if (existingCard) existingCard.remove();

  const cardHtml = `
    <aside class="hero-site-media-card" aria-label="${escapeHtml(item.title)}">
      <div class="hero-site-media-frame">
        ${renderMediaFrame(item)}
      </div>
      <div class="hero-site-media-copy">
        <p>Seleccion editorial</p>
        <h2>${escapeHtml(item.title)}</h2>
        ${item.subtitle ? `<span>${escapeHtml(item.subtitle)}</span>` : ''}
      </div>
    </aside>
  `;

  if (item.type === 'IMAGE') {
    hero.style.setProperty('--hero-media-url', `url("${escapeCssUrl(item.url)}")`);
    hero.classList.add('hero--with-site-media');
    hero.insertAdjacentHTML('beforeend', cardHtml);
    return;
  }

  const existing = hero.querySelector('.hero-site-video');
  if (existing) existing.remove();

  hero.insertAdjacentHTML(
    'afterbegin',
    `<div class="hero-site-video" aria-hidden="true">${renderMediaFrame(item)}</div>`
  );
  hero.insertAdjacentHTML('beforeend', cardHtml);
  hero.classList.add('hero--with-site-video');
}

function applyCubeFaces(items: SiteMedia[]): void {
  const faces = [
    '.hero-cubo-frente',
    '.hero-cubo-derecha',
    '.hero-cubo-detras',
    '.hero-cubo-izquierda',
    '.hero-cubo-arriba',
    '.hero-cubo-abajo',
  ];

  const images = items
    .filter((item) => item.type === 'IMAGE')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!images.length) return;

  faces.forEach((selector, index) => {
    const face = document.querySelector<HTMLElement>(selector);
    const item = images[index] || images[index % images.length];
    if (!face || !item) return;

    face.style.setProperty('--cube-face-image', `url("${escapeCssUrl(item.url)}")`);
    face.setAttribute('aria-label', item.altText || item.title);
    face.classList.add('hero-cubo-cara--media');
  });
}

function insertAfterSelector(selector: string, html: string): void {
  const target = document.querySelector(selector);
  if (!target || target.nextElementSibling?.classList.contains('site-media-section')) return;
  target.insertAdjacentHTML('afterend', html);
}

function insertBeforeSelector(selector: string, html: string): void {
  const target = document.querySelector(selector);
  if (!target || target.previousElementSibling?.classList.contains('site-media-section')) return;
  target.insertAdjacentHTML('beforebegin', html);
}

export async function initSiteMedia(): Promise<void> {
  try {
    const items = await getSiteMedia();
    const groups = groupSiteMedia(items);

    const hero = groups.HERO_BACKGROUND?.[0];
    if (hero) applyHeroMedia(hero);

    const catalog = groups.CATALOG_SUPPORT?.[0];
    if (catalog) insertAfterSelector('#catalogo .catalogo-encabezado', renderSupportSection(catalog, 'catalog'));

    const about = groups.ABOUT_SUPPORT?.[0];
    if (about) insertAfterSelector('#nosotros .nosotros-mision', renderSupportSection(about, 'about'));

    const contact = groups.CONTACT_SUPPORT?.[0];
    if (contact) insertBeforeSelector('footer', renderSupportSection(contact, 'contact'));

    const cubeFaces = groups.CUBE_FACE || [];
    if (cubeFaces.length) applyCubeFaces(cubeFaces);
  } catch {
    // El contenido editorial es opcional; la pagina debe seguir fluida si no carga.
  }
}
