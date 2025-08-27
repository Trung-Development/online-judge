import { Metadata } from "next";
import SubmissionViewPage from "./SubmissionViewPage";
import { Config } from "@/config";
import { forbidden, notFound } from "next/navigation";
import { getProblem } from "@/lib/server-actions/problems";
import { getAuthSession } from "@/lib/auth";

// Use Node.js runtime for server actions compatibility
export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  try {
    const { slug, id } = await params;
    const session = await getAuthSession();
    const problem = await getProblem(slug, session?.sessionToken);
    if (!problem) {
      return {
        title: `No such problem - ${Config.siteDescription}`,
        description: "Problem not found",
      };
    }
    return {
      title: `Submission #${id} - ${problem.name} - ${Config.siteDescription}`,
      description: `View submission #${id} for ${problem.name}`,
    };
  } catch {
    return {
      title: `Submission View - ${Config.siteDescription}`,
      description: "View submission details",
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const session = await getAuthSession();
  const problem = await getProblem(slug, session?.sessionToken);

  if (!problem || problem == 404) notFound();
  else if (problem == 403) forbidden();

  return (
    <SubmissionViewPage
      problem={problem}
      slug={slug}
      submissionId={parseInt(id)}
    />
  );
}
