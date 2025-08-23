import { env } from "../env";

export async function getTypesNames(token?: string): Promise<string[]> {
    try {
        const baseUrl = env.API_ENDPOINT;
        const url = new URL("/client/types/names", baseUrl);

        const headers = new Headers();
        if (token && token.length > 0)
            headers.append("Authorization", `Bearer ${token}`);

        const response = await fetch(url.toString(), {
            headers,
            next: {
                revalidate: 60, // Revalidate after 60 seconds
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch types names: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching types names:", error);
        return [];
    }
}