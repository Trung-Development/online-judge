import { TAllowedLang, TProblemStatus } from "@/types";
import { env } from "../env";

export interface ISubmissionsData {
  timestamp: number; // UNIX timestamp in milliseconds
  problemSlug: string;
  problemName: string;
  problemCategory: string;
  points: number;
  status: TProblemStatus;
  language: TAllowedLang;
}

export interface IUserData {
  totalPoints: number;
  rankByPoints?: number; // Made optional since backend no longer calculates this for performance
  submissions: ISubmissionsData[];
  bio: string;
  avatarURL: string;
  rating: number;
}

// Interface for users list
export interface IUsersListData {
  username: string;
  rating: number;
  totalPoints: number;
  problemsSolved: number;
  isDeleted?: boolean;
}

export async function getUsers() {
  const apiBase = env.API_ENDPOINT;

  if (!apiBase) {
    throw new Error("API base URL is not defined");
  }

  const response = await fetch(new URL("/client/users", apiBase).toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  const data: IUserData[] = await response.json();
  return data;
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

  const response = await fetch(new URL("/client/users/all", apiBase).toString(), {
    method: "GET",
    // request fresh data, do not allow any caching at the Next.js fetch layer
    cache: 'no-store',
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users list: ${response.statusText}`);
  }

  const data: IUsersListData[] = await response.json();
  return data;
}
