import { multimediaService } from '../services/multimediaService.js';
import { DynamicMedia } from '../components/DynamicMedia.js';

export async function loadMultimediaForSection(page: string, section: string, containerSelector: string) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  console.log(`[Multimedia] Loading for ${page}/${section}...`);
  const items = await multimediaService.getByPageAndSection(page, section);
  console.log(`[Multimedia] Found ${items.length} items for ${page}/${section}`);
  if (items.length === 0) return;

  // For background type, we might want to prepend or handle differently
  // For now, we'll just append them to the container
  
  const html = items.map(item => DynamicMedia(item)).join('');
  
  if (section === 'HERO_BACKGROUND') {
    container.insertAdjacentHTML('afterbegin', html);
  } else {
    container.innerHTML += html;
  }
}

export async function initMultimedia() {
  // Load initial multimedia for common sections
  void loadMultimediaForSection('HOME', 'HERO_BACKGROUND', '.hero');
  void loadMultimediaForSection('HOME', 'SUPPORT_1', '#nosotros');
  void loadMultimediaForSection('HOME', 'FOOTER_BACKGROUND', '.footer');
}
