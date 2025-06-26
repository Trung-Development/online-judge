export interface IProblemData {
  // Basic information
  code: string; // Unique identifier for the problem
  name: string;
  org: string[];
  
  // Metadata
  category: string;
  type: string[];
  points: number;
  solution: boolean;

  stats: {
    submissions: number;
    ACSubmissions: number;
  }
}

// Server action to fetch all problems with caching
export async function getProblems(): Promise<IProblemData[]> {
  try {
    const baseUrl = process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;
    const url = new URL("/client/problems/all", baseUrl);

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch problems: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching problems:", error);
    return [];
  }
}

// Server action to fetch a single problem
export async function getProblem(slug: string) {
  try {
    const baseUrl = process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;
    const url = new URL(`/client/problems/${slug}`, baseUrl);

    const response = await fetch(url.toString(), {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch problem: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching problem:", error);
    throw error;
  }
}