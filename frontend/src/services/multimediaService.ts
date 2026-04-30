import { buildApiUrl } from '../config/api.js';

export interface MultimediaContent {
  id: string;
  title: string | null;
  alt: string | null;
  type: 'IMAGE' | 'VIDEO' | 'BACKGROUND' | 'SUPPORT';
  url: string;
  page: string;
  section: string;
  position: string | null;
  priority: number;
  isActive: boolean;
  overlayOpacity: number;
  alignment: string | null;
  size: string | null;
  desktopVisible: boolean;
  mobileVisible: boolean;
}

export const multimediaService = {
  async getByPageAndSection(page: string, section: string): Promise<MultimediaContent[]> {
    try {
      const response = await fetch(buildApiUrl(`multimedia/page/${page}/section/${section}`));
      if (!response.ok) throw new Error('Failed to fetch multimedia');
      return await response.json();
    } catch (error) {
      console.error('Error fetching multimedia:', error);
      return [];
    }
  }
};
