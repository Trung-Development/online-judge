import { Config } from "@/config";
import LoginPage from "./LoginPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Login - ${Config.siteDescription}`,
};

export default function Page() {
  return <LoginPage />;
}
