import { Metadata } from "next";
import Home from "./MainPage";
import { Config } from "@/config";

export const runtime = 'edge';

export const metadata: Metadata = {
  title: `Home - ${Config.siteDescription}`,
};

export default function Page() {
  return <Home />;
}
