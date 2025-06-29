import { TAllowedLang, TProblemStatus } from "@/types";

export interface ISubmissionsData {
  timestamp: number;
  problemCode: string;
  problemName: string;
  problemCategory: string;
  points: number;
  status: TProblemStatus;
  language: TAllowedLang[];
}

export interface IUserData {
  totalPoints: number;
  rankByPoints: number;
  submissions: ISubmissionsData[];
  bio: string;
}

export async function getUsers() {
  const apiBase =
    process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;

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
  const apiBase =
    process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;

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
