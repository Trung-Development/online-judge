import { Metadata } from "next";
import { Config } from "@/config";
import UsersPage from "./UsersPage";
import { getUsersList } from "@/lib/server-actions/users";

// Use Node.js runtime for server actions compatibility
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: `Leaderboard - ${Config.siteDescription}`,
  description: `Leaderboard of users on ${Config.sitename}. View user ratings, ranks, and statistics.`,
};

export default async function Page() {
  try {
    const users = await getUsersList();
    return <UsersPage initialUsers={users} />;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    // Return with mock data as fallback for development
    const mockUsers = [
      {
        username: "alice",
        rating: 2150,
        totalPoints: 2500,
        problemsSolved: 45,
      },
      {
        username: "bob",
        rating: 1850,
        totalPoints: 1800,
        problemsSolved: 32,
      },
      {
        username: "charlie",
        rating: 1420,
        totalPoints: 1200,
        problemsSolved: 28,
      },
      {
        username: "diana",
        rating: 950,
        totalPoints: 800,
        problemsSolved: 15,
      },
    ];
    return <UsersPage initialUsers={mockUsers} />;
  }
}
