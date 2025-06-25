import { Metadata } from "next";
import ProblemsPage from "./ProblemsPage";
import { Config } from "@/config";
import { getProblems } from "@/lib/server-actions/problems";

// Use Node.js runtime for server actions compatibility
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: `Problem - ${Config.siteDescription}`,
  description: "List of problems available in the YACPS Online Judge.",
};

export default async function Page() {
  const problems = await getProblems();
  return <ProblemsPage initialProblems={problems} />;
}
