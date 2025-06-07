import { Config } from "@/config";
import LoginPage from "./LoginPage";
import { Metadata } from "next";
import { Suspense } from "react";
import Loading from "@/app/loading";

export const metadata: Metadata = {
  title: `Login - ${Config.siteDescription}`,
};

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginPage />
    </Suspense>
  );
}
