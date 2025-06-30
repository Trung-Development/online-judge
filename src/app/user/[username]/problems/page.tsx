import { Config } from "@/config";
import { getUser } from "@/lib/server-actions/users";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UserProblemsPage from "./UserProblemsPage";
import { Metadata } from "next";

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
  const session = await getServerSession(authOptions);
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
