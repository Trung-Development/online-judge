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
export async function getProblems(token?: string): Promise<IProblemData[]> {
  try {
    const baseUrl = process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;
    const url = new URL("/client/problems/all", baseUrl);


    const headers = new Headers()
    if(token && token.length > 0) headers.append('Authorization', `Bearer ${token}`);

    const response = await fetch(url.toString(), {
      headers
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
export async function getProblem(slug: string, token?: string) {
  try {
    const baseUrl = process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;
    const url = new URL(`/client/problems/${slug}`, baseUrl);

    const headers = new Headers()
    if(token && token.length > 0) headers.append('Authorization', `Bearer ${token}`);

    const response = await fetch(url.toString(), {
      headers
    });
    
    const json = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      } else if(response.status === 403) {
        throw new Error('You are not allowed to view this problem', {
          cause: json?.message
        });
      }
      throw new Error(`Failed to fetch problem: ${json?.message || response.status}`);
    }

    return json;
  } catch (error) {
    throw error;
  }
}