import { apiClient } from './client';

export interface Category {
  categoryId: number;
  value: string;
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get('/categories');
  return res.categories || [];
}
