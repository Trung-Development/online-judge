import { Config } from "@/config";
import { getUser } from "@/lib/server-actions/users";
import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import UserProblemsPage from "./UserProblemsPage";
import { Metadata } from "next";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}'s Problems - ${Config.siteDescription}`,
  };
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
    <UserProblemsPage
      userData={userData}
      username={username}
      serverUser={session?.user}
    />
  );
}
