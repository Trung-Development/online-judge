export async function getCategoriesNames(): Promise<string[]> {
  try {
    const isServer = typeof window === "undefined";
    const url = isServer
      ? new URL("/client/categories/names", process.env.API_ENDPOINT).toString()
      : "/api/categories/names";
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok)
      throw new Error(`Failed to fetch categories names: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("Error fetching categories names:", e);
    return [];
  }
}

export async function getCategories(): Promise<{ id: number; name: string }[]> {
  try {
    const isServer = typeof window === "undefined";
    const url = isServer
      ? new URL("/client/categories/all", process.env.API_ENDPOINT).toString()
      : "/api/categories/all";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("Error fetching categories:", e);
    return [];
  }
}
