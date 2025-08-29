import { Metadata } from "next";
import ManageProblemPage from "./ManageClient";
import { Config } from "@/config";
import { getProblem } from "@/lib/server-actions/problems";
import { getAuthSession } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { IProblemPageData } from "@/types";
import UnlockLockedProblem from "./UnlockProblem";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "edge";

export const metadata: Metadata = {
  title: `Manage Problem - ${Config.siteDescription}`,
  description: `Manage and edit problem on ${Config.sitename}.`,
};

function generateOverlayWarning(message: string) {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <Alert variant="warning" className="mb-6">
        <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
        <AlertDescription>
          {message}
        </AlertDescription>
      </Alert>
    </main>
  )
}

function generateOverlayError(message: string) {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <Alert variant="destructive" className="mb-6">
        <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4" />
        <AlertDescription>
          {message}
        </AlertDescription>
      </Alert>
    </main>
  )
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getAuthSession();
  const { slug } = await params;
  let problem = await getProblem(slug, session?.sessionToken);
  if (!problem || problem == 404 || (problem.error && problem.error === "PROBLEM_NOT_FOUND"))
    return generateOverlayError(
      "The problem you are trying to access does not exist. Please check the URL and try again.",
    )
  else {
    if (problem == 403) return generateOverlayWarning(
      "You do not have the permission to edit this problem. Please contact the administrator if you believe this is an error.",
    )
    if (problem?.isLocked) return <UnlockLockedProblem problem={problem} sessionToken={session?.sessionToken} user={session?.user} isAuthenticated={!!session} />
    if (problem?.isDeleted) return generateOverlayError(
      "This problem is marked as deleted and cannot be edited. Please check the URL and try again later.",
    )
  }
  problem = problem as IProblemPageData;
  return <ManageProblemPage problem={problem} user={session?.user} sessionToken={session?.sessionToken} />;
}
