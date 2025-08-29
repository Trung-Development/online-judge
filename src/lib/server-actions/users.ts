import { env } from "../env";

export interface IUserData {
  totalPoints: number;
  solvedProblems: number;
  // rankByPoints?: number; // removed since backend no longer calculates this for performance and fe can calculate the ranking
  // submissions: ISubmissionsData[]; // removed because there is submissions list page
  bio: string;
  avatarURL: string;
  rating: number;
}

export interface IActivityHeatmapSubmission {
  timestamp: number;
}

export interface ISolvedAndAttemptedProblems {
  totalPoints: number;
  data: {
    slug: string;
    name: string;
    categoryId: number;
    points: number;
    solved: boolean | null;
  }[];
}

// Interface for users list
export interface IUsersListData {
  username: string;
  fullname: string;
  rating: number;
  totalPoints: number;
  problemsSolved: number;
  isDeleted?: boolean;
}

export async function getUser(username: string): Promise<IUserData> {
  const apiBase = env.API_ENDPOINT;

  if (!apiBase) {
    throw new Error("API base URL is not defined");
  }

  const [userResponse, avatarResponse] = await Promise.all([
    fetch(new URL(`/client/users/details/${username}`, apiBase).toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }),
    fetch(new URL(`/client/users/avatar/${username}`, apiBase).toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }),
  ]);

  if (!userResponse.ok) {
    throw new Error(`Failed to fetch user: ${userResponse.statusText}`);
  }

  if (!avatarResponse.ok) {
    throw new Error(`Failed to fetch avatar URL: ${avatarResponse.statusText}`);
  }

  const userData: IUserData = await userResponse.json();
  const avatarData: { avatarURL: string } = await avatarResponse.json();

  return { ...userData, avatarURL: avatarData.avatarURL };
}

export async function getUsersList(): Promise<IUsersListData[]> {
  const apiBase = env.API_ENDPOINT;

  if (!apiBase) {
    throw new Error("API base URL is not defined");
  }

  const response = await fetch(
    new URL("/client/users/all", apiBase).toString(),
    {
      method: "GET",
      // request fresh data, do not allow any caching at the Next.js fetch layer
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch users list: ${response.statusText}`);
  }

  const data: IUsersListData[] = await response.json();
  return data;
}

export async function getSolvedAndAttemptedProblems(
  username: string,
): Promise<ISolvedAndAttemptedProblems> {
  const apiBase = env.API_ENDPOINT;

  if (!apiBase) {
    throw new Error("API base URL is not defined");
  }

  const response = await fetch(
    new URL(`/client/users/sap_problems/${username}`, apiBase).toString(),
    {
      method: "GET",
      // request fresh data, do not allow any caching at the Next.js fetch layer
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch solved and attempted problems list: ${response.statusText}`,
    );
  }

  const data: ISolvedAndAttemptedProblems = await response.json();
  return data;
}

export async function getActivityHeatmapSubmissions(
  username: string,
): Promise<IActivityHeatmapSubmission[]> {
  const apiBase = env.API_ENDPOINT;

  const response = await fetch(
    new URL(`/client/submissions/heatmap/${username}`, apiBase).toString(),
    {
      method: "GET",
      // request fresh data, do not allow any caching at the Next.js fetch layer
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch activity heatmap submissions list: ${response.statusText}`,
    );
  }

  const data: IActivityHeatmapSubmission[] = await response.json();
  return data;
}
