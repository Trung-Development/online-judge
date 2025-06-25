import ProblemPage from "./ProblemPage";
import { Metadata } from "next";
import { Config } from "../../../config";
import { notFound } from "next/navigation";
import { getProblem } from "@/lib/server-actions/problems";

// Use Node.js runtime for server actions compatibility
export const runtime = 'nodejs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const problem = await getProblem(slug);
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
  const problem = await getProblem(slug);
  
  if (!problem) {
    notFound();
  }
  
  return <ProblemPage problem={problem} slug={slug} />;
}
