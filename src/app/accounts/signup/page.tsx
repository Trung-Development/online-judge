import { Metadata } from "next";
import SignupPage from "./SignupPage";
import { Config } from "@/config";

export const metadata: Metadata = {
  title: `Register - ${Config.siteDescription}`,
};

export default function Page() {
  return <SignupPage />;
}
