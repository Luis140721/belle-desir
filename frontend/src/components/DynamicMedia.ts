import { MultimediaContent } from '../services/multimediaService.js';

export function DynamicMedia(item: MultimediaContent): string {
  if (!item.isActive) return '';

  const isVideo = item.type === 'VIDEO';
  const isBackground = item.type === 'BACKGROUND';
  const visibilityClass = !item.desktopVisible ? 'hide-desktop' : !item.mobileVisible ? 'hide-mobile' : '';
  
  let content = '';

  if (isVideo) {
    let videoUrl = item.url;
    // Handle Google Drive Links
    if (videoUrl.includes('drive.google.com')) {
      const id = videoUrl.match(/\/file\/d\/(.+?)\//)?.[1] || videoUrl.match(/id=(.+?)(&|$)/)?.[1];
      if (id) {
        // Embed URL for Drive
        videoUrl = `https://drive.google.com/embed?id=${id}&autoplay=1&mute=1&loop=1&playlist=${id}`;
      }
    }

    content = `
      <div class="video-container" style="padding-top: 56.25%; position: relative; width: 100%; height: 100%;">
        <iframe 
          src="${videoUrl}" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
          allow="autoplay; encrypted-media" 
          allowfullscreen
          loading="lazy">
        </iframe>
      </div>
    `;
  } else {
    const style = [
      item.size ? `object-fit: ${item.size}` : 'object-fit: cover',
      item.alignment ? `object-position: ${item.alignment}` : 'object-position: center',
      'width: 100%',
      'height: 100%',
      'display: block'
    ].join('; ');

    content = `
      <img 
        src="${item.url}" 
        alt="${item.alt || item.title || ''}" 
        style="${style}"
        loading="lazy"
        class="dynamic-image"
      />
    `;
  }

  const overlayHtml = item.overlayOpacity > 0 
    ? `<div class="media-overlay" style="background: rgba(0,0,0,${item.overlayOpacity}); position: absolute; inset: 0; pointer-events: none; z-index: 1;"></div>` 
    : '';

  const wrapperStyle = isBackground 
    ? 'position: absolute; inset: 0; z-index: -1;' 
    : 'position: relative; overflow: hidden;';

  return `
    <div class="dynamic-media-wrapper ${visibilityClass} type-${item.type.toLowerCase()}" 
         data-id="${item.id}"
         data-priority="${item.priority}"
         style="${wrapperStyle}">
      ${content}
      ${overlayHtml}
    </div>
  `;
}
