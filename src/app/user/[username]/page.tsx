import { Metadata } from "next";
import { Config } from "@/config";
import { getUser } from "@/lib/server-actions/users";
import { notFound } from "next/navigation";
import UserPage from "./UserPage";
import { getAuthSession } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  try {
    const { username } = await params;
    const user = await getUser(username);
    if (!user) {
      return {
        title: `No such user - ${Config.siteDescription}`,
        description: "User not found",
      };
    }
    return {
      title: `User ${username} - ${Config.siteDescription}`,
      description: user.bio,
    };
  } catch {
    return {
      title: `No such user - ${Config.siteDescription}`,
      description: "User not found",
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  // Get the current session to check if the user is viewing their own profile
  const { username } = await params;
  const session = await getAuthSession();
  const userData = await getUser(username);
  if (!userData) notFound();

  return (
    <UserPage
      userData={userData}
      username={username}
      serverUser={session?.user}
    />
  );
}