import { Config } from "@/config";
import { Metadata } from "next";
import SubmissionsPage from "./SubmissionsPage";

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ author?: string; problemSlug?: string; }>
}): Promise<Metadata> {
  const queries = await searchParams;
  if(queries.author && queries.problemSlug) return {
    title: `${queries.author}'s submissions for ${queries.problemSlug} - ${Config.siteDescription}`,
    description: `View ${queries.author}'s submissions for the problem ${queries.problemSlug} on ${Config.sitename}`,
  }
  if(queries.author) return {
    title: `${queries.author}'s submissions - ${Config.siteDescription}`,
    description: `View ${queries.author}'s submissions on ${Config.sitename}`,
  }
  if(queries.problemSlug) return {
    title: `Submissions for ${queries.problemSlug} - ${Config.siteDescription}`,
    description: `View public submissions for the problem ${queries.problemSlug} on ${Config.sitename}`,
  }
  return {
    title: `Submissions list - ${Config.siteDescription}`,
    description: `View public submissions on ${Config.sitename}`,
  };
}

export default async function Page() {
  return <SubmissionsPage />;
}
