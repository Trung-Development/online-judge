import ProblemPage from "./ProblemPage";
import { Metadata } from "next";
import { Config } from "../../../config";
import { notFound } from "next/navigation";

async function getProblem(slug: string) {
  const baseUrl =
    process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_API_ENDPOINT;
  const url = new URL(`/client/problems/${slug}`, baseUrl);
  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 404) {
      notFound();
    }
    throw new Error("Problem not found");
  }
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const problem = await getProblem(slug);
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
  console.log(problem);
  return <ProblemPage problem={problem} slug={slug} />;
}
