import { apiClient } from './client';

export interface Category {
  categoryId: number;
  value: string;
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get<unknown>('/categories');
  if (Array.isArray(res)) {
    return res as Category[];
  } else if (res && typeof res === 'object' && 'categories' in res) {
    return (res as { categories: Category[] }).categories || [];
  }
  return [];
}
