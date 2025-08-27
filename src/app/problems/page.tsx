import { Metadata } from "next";
import ProblemsPage from "./ProblemsPage";
import { Config } from "@/config";
import { getProblems, getProblemStatus } from "@/lib/server-actions/problems";
import { getAuthSession } from "@/lib/auth";
import { getCategoriesNames } from "@/lib/server-actions/categories";
import { getTypesNames } from "@/lib/server-actions/types";

// Use Node.js runtime for server actions compatibility
export const runtime = "edge";

export const metadata: Metadata = {
  title: `Problems list - ${Config.siteDescription}`,
  description: "List of problems available in the YACPS Online Judge.",
};

export default async function Page() {
  const session = await getAuthSession();
  let problems = await getProblems(session?.sessionToken);
  const statuses = await getProblemStatus(session?.sessionToken);
  const categories = await getCategoriesNames(session?.sessionToken);
  const types = (await getTypesNames(session?.sessionToken)).map((type) => ({
    value: type,
    label: type,
  }));
  problems = problems.map((v) => {
    return {
      ...v,
      status: statuses.find((x) => x.slug == v.code),
    };
  });
  return (
    <ProblemsPage
      initialProblems={problems}
      initialCategories={categories}
      initialTypes={types}
    />
  );
}
