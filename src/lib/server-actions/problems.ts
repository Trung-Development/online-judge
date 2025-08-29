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

    const response = await fetch(url.toString(), {
      // dev phase - no cache
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      cache: "no-store",
      next: { revalidate: 0 },
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
        `Failed to fetch problem: ${json?.message || response.status}`,
      );
    }

    return json;
  } catch (error) {
    throw error;
  }
}

export async function getProblemStatus(
  token?: string,
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
        `Failed to fetch problems status: ${json?.message || response.status}`,
      );
    }

    return json;
  } catch (error) {
    console.error("Error fetching problems status: ", error);
    return [];
  }
}

// Server action to create a new problem on the backend using server-side fetch
export async function createProblem(
  data: {
    slug: string;
    name: string;
    points: number;
    description: string;
    categoryId?: number;
    types?: number[];
    allowedLanguages?: string[];
    timeLimit?: number;
    memoryLimit?: number;
    short_circuit?: boolean;
  },
  token?: string,
) {
  try {
    const baseUrl = env.API_ENDPOINT;
    const url = new URL(`/client/problems/new`, baseUrl);

    const headers = new Headers({
      "Content-Type": "application/json",
    });
    if (token && token.length > 0)
      headers.append("Authorization", `Bearer ${token}`);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        slug: data.slug,
        name: data.name,
        points: data.points,
        description: data.description,
        categoryId: data.categoryId,
        types: data.types,
        allowedLanguages: data.allowedLanguages,
        timeLimit: data.timeLimit ?? 1,
        memoryLimit: data.memoryLimit ?? 256,
        short_circuit: data.short_circuit ?? false,
      }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        json?.message || `Failed to create problem: ${response.status}`;
      throw new Error(message);
    }

    return json;
  } catch (err: unknown) {
    console.error("createProblem error:", err);
    if (err instanceof Error) throw err;
    throw new Error("Unknown error in createProblem");
  }
}

// Server action to update a problem
export async function updateProblem(
  slug: string,
  data: {
    slug?: string;
    name?: string;
    description?: string;
    categoryId?: number;
    types?: number[];
    allowedLanguages?: string[];
    timeLimit?: number;
    memoryLimit?: number;
  },
  token?: string,
) {
  try {
    const baseUrl = env.API_ENDPOINT;
    const url = new URL(
      `/client/problems/${encodeURIComponent(slug)}`,
      baseUrl,
    );

    const headers = new Headers({
      "Content-Type": "application/json",
    });
    if (token && token.length > 0)
      headers.append("Authorization", `Bearer ${token}`);

    const response = await fetch(url.toString(), {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        json?.message || `Failed to update problem: ${response.status}`;
      throw new Error(message);
    }

    return json;
  } catch (err: unknown) {
    console.error("updateProblem error:", err);
    if (err instanceof Error) throw err;
    throw new Error("Unknown error in updateProblem");
  }
}

// Server action to delete a problem
export async function deleteProblem(slug: string, token?: string) {
  try {
    const baseUrl = env.API_ENDPOINT;
    const url = new URL(
      `/client/problems/${encodeURIComponent(slug)}`,
      baseUrl,
    );

    const headers = new Headers();
    if (token && token.length > 0)
      headers.append("Authorization", `Bearer ${token}`);

    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers,
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        json?.message || `Failed to delete problem: ${response.status}`;
      throw new Error(message);
    }

    return json;
  } catch (err: unknown) {
    console.error("deleteProblem error:", err);
    if (err instanceof Error) throw err;
    throw new Error("Unknown error in deleteProblem");
  }
}

export async function changeLockStatus(slug: string, token?: string) {
  try {
    const baseUrl = env.API_ENDPOINT;
    const url = new URL(
      `/client/problems/${encodeURIComponent(slug)}/lock`,
      baseUrl,
    );

    const headers = new Headers();
    if (token && token.length > 0)
      headers.append("Authorization", `Bearer ${token}`);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        json?.message || `Failed to delete problem: ${response.status}`;
      throw new Error(message);
    }

    return json;
  } catch (err: unknown) {
    console.error("changeLockStatus error:", err);
    if (err instanceof Error) throw err;
    throw new Error("Unknown error in changeLockStatus");
  }
}