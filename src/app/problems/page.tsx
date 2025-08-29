import { Metadata } from "next";
import ProblemsPage from "./ProblemsPage";
import { Config } from "@/config";
import { getProblems, getProblemStatus } from "@/lib/server-actions/problems";
import { getAuthSession } from "@/lib/auth";
import { getCategoriesNames } from "@/lib/server-actions/categories";
import { getTypesNames } from "@/lib/server-actions/types";

export const metadata: Metadata = {
  title: `Problems list - ${Config.siteDescription}`,
  description: "List of problems available in the YACPS Online Judge.",
};

export default async function Page() {
  const session = await getAuthSession();
  let problems = await getProblems(session?.sessionToken);
  const statuses = await getProblemStatus(session?.sessionToken);
  const categories = await getCategoriesNames();
  const types = (await getTypesNames()).map((type) => ({
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
      sessionToken={session?.sessionToken}
      user={session?.user}
      initialProblems={problems}
      initialCategories={categories}
      initialTypes={types}
    />
  );
}
