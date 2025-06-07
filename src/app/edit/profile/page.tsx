import { Metadata } from "next";
import { Config } from "@/config";
import { getAuthSession } from "@/lib/auth";
import EditProfilePage from "./EditProfilePage";
import { OverlayWarning } from "@/components/CustomAlert";

export const runtime = "edge";

export const metadata: Metadata = {
  title: `Edit Profile - ${Config.siteDescription}`,
};

export default async function Page() {
  // Get the current session to check if user is logged in
  const session = await getAuthSession();
  if (!session?.user || !session?.user) return <OverlayWarning message="You must be logged in to view this page." />;

  return <EditProfilePage user={session.user} />;
}
