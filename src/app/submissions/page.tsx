import { Config } from "@/config";
import { Metadata } from "next";
import SubmissionsPage from "./SubmissionsPage";

export async function generateMetadata(): Promise<Metadata> {
    return {
      title: `Submission list - ${Config.siteDescription}`,
      description: `View public submissions of ${Config.sitename}`,
    };
}

export default async function Page() {
  return <SubmissionsPage />;
}
