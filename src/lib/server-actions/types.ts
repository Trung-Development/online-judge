export async function getTypesNames(): Promise<string[]> {
  try {
    const isServer = typeof window === "undefined";
    const url = isServer
      ? new URL("/client/types/names", process.env.API_ENDPOINT).toString()
      : "/api/types/names";
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Failed to fetch types names: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("Error fetching types names:", e);
    return [];
  }
}

export async function getTypes(): Promise<{ id: number; name: string }[]> {
  try {
    const isServer = typeof window === "undefined";
    const url = isServer
      ? new URL("/client/types/all", process.env.API_ENDPOINT).toString()
      : "/api/types/all";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch types: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("Error fetching types:", e);
    return [];
  }
}
