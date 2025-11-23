import { apiClient } from './client';

export interface Category {
  categoryId: number;
  value: string;
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await apiClient.get<{ categories?: Category[] }>('/categories');
    
    // Handle different response formats
    if (Array.isArray(res)) {
      return res as Category[];
    } else if (res && typeof res === 'object' && 'categories' in res) {
      const categories = res.categories || [];
      console.log('Loaded categories:', categories);
      return categories;
    }
    
    console.warn('Unexpected categories response format:', res);
    return [];
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}
