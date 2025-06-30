import { Metadata } from "next";
import { Config } from "@/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import EditProfilePage from "./EditProfilePage";

export const metadata: Metadata = {
  title: `Edit Profile - ${Config.siteDescription}`,
};

export default async function Page() {
  // Get the current session to check if user is logged in
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect("/accounts/login?callbackUrl=/edit/profile");
  }

  return <EditProfilePage user={session.user} />;
}
