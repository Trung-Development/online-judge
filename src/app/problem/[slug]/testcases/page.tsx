import { notFound } from "next/navigation";
import TestcaseManagerPage from "./TestcaseManagerPage";
import { getProblem } from "@/lib/server-actions/problems";
import { getAuthSession } from "@/lib/auth";

export default async function TestcasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getAuthSession();
  const problem = await getProblem(slug, session?.sessionToken);
  
  if (!problem) {
    notFound();
  }
  
  return <TestcaseManagerPage problem={problem} slug={slug} />;
}
