export async function getTypesNames(): Promise<string[]> {
  try {
    const res = await fetch('/api/types/names', { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Failed to fetch types names: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Error fetching types names:', e);
    return [];
  }
}

export async function getTypes(): Promise<{ id: number; name: string }[]> {
  try {
    const res = await fetch('/api/types/all');
    if (!res.ok) throw new Error(`Failed to fetch types: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Error fetching types:', e);
    return [];
  }
}
