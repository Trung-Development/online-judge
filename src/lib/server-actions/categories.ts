export async function getCategoriesNames(): Promise<string[]> {
  try {
    const res = await fetch('/api/categories/names', { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Failed to fetch categories names: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Error fetching categories names:', e);
    return [];
  }
}

export async function getCategories(): Promise<{ id: number; name: string }[]> {
  try {
    const res = await fetch('/api/categories/all');
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Error fetching categories:', e);
    return [];
  }
}
