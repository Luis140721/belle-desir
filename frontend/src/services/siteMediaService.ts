import { buildApiUrl } from '../config/api.js';
import { SiteMedia, SiteMediaPlacement } from '../types/index.js';
import { lazyJson } from '../utils/lazyApi.js';

export type SiteMediaMap = Record<SiteMediaPlacement, SiteMedia[]>;

export async function getSiteMedia(): Promise<SiteMedia[]> {
  const payload = await lazyJson<{ data: SiteMedia[] }>(buildApiUrl('/site-media'), {
    timeoutMs: 30000,
    retries: 3,
  });
  return payload.data || [];
}

export function groupSiteMedia(items: SiteMedia[]): Partial<SiteMediaMap> {
  return items.reduce<Partial<SiteMediaMap>>((groups, item) => {
    const current = groups[item.placement] || [];
    groups[item.placement] = [...current, item];
    return groups;
  }, {});
}
