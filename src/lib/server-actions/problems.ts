import { env } from "../env";

export interface ProblemStatus {
  slug: string;
  isLocked: boolean;
  isPublic: boolean;
  solved: boolean;
  attempted: boolean;
}

export interface IProblemData {
  // Basic information
  code: string; // Unique identifier for the problem
  name: string;
  org: string[];

  status?: ProblemStatus;

  // Metadata
  category: string;
  type: string[];
  points: number;
  solution: boolean;

  stats: {
    submissions: number;
    ACSubmissions: number;
  };
  isDeleted: boolean;
}

export async function getProblems(token?: string): Promise<IProblemData[]> {
  try {
    const baseUrl = env.API_ENDPOINT;
    const url = new URL("/client/problems/all", baseUrl);

    const headers = new Headers();
    if (token && token.length > 0)
      headers.append("Authorization", `Bearer ${token}`);

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: 300, // Revalidate after 5 minutes
      },
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
    const baseUrl = env.API_ENDPOINT;

    const url = new URL(`/client/problems/details/${slug}`, baseUrl);

    const headers = new Headers();
    if (token && token.length > 0)
      headers.append("Authorization", `Bearer ${token}`);

    const response = await fetch(url.toString(), {
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return 404;
      } else if (response.status === 403) {
        return 403;
      }
      throw new Error(
        `Failed to fetch problem: ${json?.message || response.status}`
      );
    }

    return json;
  } catch (error) {
    throw error;
  }
}

export async function getProblemStatus(
  token?: string
): Promise<ProblemStatus[]> {
  if (!token) return [];
  try {
    const baseUrl = env.API_ENDPOINT;

    const url = new URL(`/client/problems/all/status`, baseUrl);

    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);

    const response = await fetch(url.toString(), {
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        `Failed to fetch problems status: ${json?.message || response.status}`
      );
    }

    return json;
  } catch (error) {
    console.error("Error fetching problems status: ", error);
    return [];
  }
}
