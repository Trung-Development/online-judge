import { Metadata } from "next";
import SubmitPage from "./SubmitPage";
import { Config } from "@/config";
import { forbidden, notFound } from "next/navigation";
import { getProblem } from "@/lib/server-actions/problems";
import { getAuthSession } from "@/lib/auth";

// Use Node.js runtime for server actions compatibility
export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const session = await getAuthSession();
    const problem = await getProblem(slug, session?.sessionToken);
    if (!problem) {
      return {
        title: `No such problem - ${Config.siteDescription}`,
        description: "Problem not found",
      };
    }
    return {
      title: `Submit - ${problem.name} - ${Config.siteDescription}`,
      description: `Submit your solution for ${problem.name}`,
    };
  } catch {
    return {
      title: `Submit Solution - ${Config.siteDescription}`,
      description: "Submit your solution",
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();
  const problem = await getProblem(slug, session?.sessionToken);

  if (!problem || problem == 404) notFound();
  else if (problem == 403) forbidden();

  return <SubmitPage problem={problem} slug={slug} />;
}
