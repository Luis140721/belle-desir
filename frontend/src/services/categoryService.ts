import type { Category } from '../types/index.js';
import { buildApiUrl } from '../config/api';
import { lazyJson } from '../utils/lazyApi.js';

export async function getAllCategories(): Promise<Category[]> {
  const body = await lazyJson<{ success: boolean; data: Category[] }>(buildApiUrl('categories'), {
    timeoutMs: 30000,
    retries: 3,
  });
  return body.data;
}
