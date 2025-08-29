"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/auth";
import { hasPermission, UserPermissions } from "@/lib/permissions";
import { IProblemPageData } from "@/types";
import {
  faExclamationTriangle,
  faUnlock,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Loader2Icon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function UnlockLockedProblem({
  problem,
  sessionToken,
  user,
  isAuthenticated,
}: {
  problem: IProblemPageData;
  sessionToken?: string;
  user?: User;
  isAuthenticated?: boolean;
}) {
  const canUnlock =
    isAuthenticated &&
    (problem.author.includes(user?.username || "") ||
      problem.curator.includes(user?.username || "") ||
      hasPermission(user?.perms, UserPermissions.LOCK_PROBLEM));
  const params = useParams() as Record<string, string | undefined>;
  const slug = params.slug ?? "";
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleUnlock = async () => {
    if (!confirm("Unlock this problem? Modifications will be allowed.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/problem/${encodeURIComponent(slug)}/lock`, {
        method: "POST",
        headers: {
          Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
        },
      });
      if (!res.ok) {
        res
          .json()
          .then((v) => {
            console.log(v);
            if (v?.error) alert(`Failed to unlock problem: ${v.error}`);
            else if (v.message) {
              if (v.message === "INSUFFICIENT_PERMISSIONS")
                alert(
                  "You are not authorized to perform this operation. Please try again later.",
                );
              if (v.message === "PROBLEM_NOT_FOUND")
                alert(
                  "The problem you are trying to access does not exist. Please check the URL and try again.",
                );
            } else {
              alert(
                `Failed to load the problem: ${res.status}. More details are available in the console.`,
              );
            }
          })
          .catch((x) => {
            alert(
              `Failed to load the problem: ${res.status}. More details are available in the console`,
            );
            console.log(x);
          });
        return;
      }
      // Navigate away after delete
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <Alert variant="warning" className="mb-6">
        <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
        <AlertDescription>
          {canUnlock
            ? "This problem is currently locked. Please unlock it to allow modifications."
            : "Modifications to this problem are restricted. Please contact an administrator for further assistance."}
        </AlertDescription>
        {canUnlock && (
          <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={handleUnlock}
            disabled={loading}
          >
            {!loading ? (
              <FontAwesomeIcon icon={faUnlock} className="w-4 h-4" />
            ) : (
              <Loader2Icon className="animate-spin" />
            )}
            {loading ? "Unlocking..." : "Unlock"}
          </Button>
        )}
      </Alert>
    </main>
  );
}
