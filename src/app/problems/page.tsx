import { Metadata } from "next";
import ProblemsPage from "./ProblemsPage";
import { Config } from "@/config";
import { getProblems, getProblemStatus } from "@/lib/server-actions/problems";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

// Use Node.js runtime for server actions compatibility
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: `Problem - ${Config.siteDescription}`,
  description: "List of problems available in the YACPS Online Judge.",
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  let problems = await getProblems(session?.sessionToken);
  const statuses = await getProblemStatus(session?.sessionToken);
  problems = problems.map((v) => {
    return {
      ...v,
      status: statuses.find((x) => x.slug == v.code),
    };
  });
  return <ProblemsPage initialProblems={problems} />;
}
