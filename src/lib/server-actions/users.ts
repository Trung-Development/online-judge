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

export async function getUser(username: string) {
  const apiBase = env.API_ENDPOINT;

  if (!apiBase) {
    throw new Error("API base URL is not defined");
  }

  const response = await fetch(
    new URL(`/client/users/details/${username}`, apiBase).toString(),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  const data: IUserData = await response.json();
  return data;
}

export async function getUsersList(): Promise<IUsersListData[]> {
  const apiBase = env.API_ENDPOINT;

  if (!apiBase) {
    throw new Error("API base URL is not defined");
  }

  const response = await fetch(new URL("/client/users/list", apiBase).toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users list: ${response.statusText}`);
  }

  const data: IUsersListData[] = await response.json();
  return data;
}
