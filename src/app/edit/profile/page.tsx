import { Metadata } from "next";
import { Config } from "@/config";
import { requireAuth } from "@/lib/auth";
import EditProfilePage from "./EditProfilePage";

export const metadata: Metadata = {
  title: `Edit Profile - ${Config.siteDescription}`,
};

export default async function Page() {
  // Get the current session to check if user is logged in
  const session = await requireAuth();

  return <EditProfilePage user={session.user} />;
}
