import { Metadata } from "next";
import ManageClient from "./ManageClient";
import { Config } from "@/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "edge";

export const metadata: Metadata = {
  title: `Manage Problem - ${Config.siteDescription}`,
  description: `Manage and edit problem on ${Config.sitename}.`,
};
export default function Page() {
  return <ManageClient />;
}
