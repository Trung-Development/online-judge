import { Metadata } from "next";
import ProblemsPage from "./ProblemsPage";
import { Config } from "@/config";

export const metadata: Metadata = {
  title: `Problem - ${Config.siteDescription}`,
  description: "List of problems available in the YACPS Online Judge.",
};

export default function Page() {
  return <ProblemsPage />;
}
