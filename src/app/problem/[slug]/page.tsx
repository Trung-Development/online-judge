import ProblemPage from "./ProblemPage";
import { Metadata } from "next";
import { Config } from "../../../config";
import { forbidden, notFound } from "next/navigation";
import { getProblem } from "@/lib/server-actions/problems";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Use Node.js runtime for server actions compatibility
export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    const problem = await getProblem(slug, session?.sessionToken);
    if (!problem) {
      return {
        title: `No such problem - ${Config.siteDescription}`,
        description: "Problem not found",
      };
    }
    return {
      title: `${problem.name} - ${Config.siteDescription}`,
      description: problem.body,
    };
  } catch {
    return {
      title: `No such problem - ${Config.siteDescription}`,
      description: "Problem not found",
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const problem = await getProblem(slug, session?.sessionToken);

  if (!problem || problem == 404) notFound();
  else if (problem == 403) forbidden();

  return <ProblemPage problem={problem} slug={slug} />;
}
