import { Config } from "@/config";
import { getSolvedAndAttemptedProblems, getUser } from "@/lib/server-actions/users";
import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import UserProblemsPage from "./UserProblemsPage";
import { Metadata } from "next";
import { getCategories } from "@/lib/server-actions/categories";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}'s Solved and Attempted Problems - ${Config.siteDescription}`,
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
  const SAP = await getSolvedAndAttemptedProblems(username);
  const userData = await getUser(username);
  const categories = await getCategories();
  if (!userData) notFound();

  return (
    <UserProblemsPage
      userData={userData}
      username={username}
      SAP={SAP}
      categories={categories}
      serverUser={session?.user}
    />
  );
}
