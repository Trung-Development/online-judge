"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/AuthProvider";
import { IProblemPageData } from "@/types";
import { canEditProblemTestcases } from "@/lib/permissions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faEye,
  faUsers,
  faGlobe,
  faCheck,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

interface TestcaseManagerPageProps {
  problem: IProblemPageData;
  slug: string;
}

export default function TestcaseManagerPage({ problem, slug }: TestcaseManagerPageProps) {
  const { user, sessionToken } = useAuth();
  const router = useRouter();
  
  const [visibility, setVisibility] = useState<'AUTHOR_ONLY' | 'EVERYONE'>(
    problem.testcaseDataVisibility || 'AUTHOR_ONLY'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if current user can edit test cases
  const canUserEditTestcases = user && canEditProblemTestcases(
    user.perms,
    problem.author,
    problem.curator,
    problem.tester || [],
    user.id
  );

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!canUserEditTestcases && !loading) {
      router.push(`/problem/${slug}`);
    }
  }, [canUserEditTestcases, router, slug, loading]);

  const handleSave = async () => {
    if (!sessionToken) {
      setError("You must be logged in to save changes.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/problems/${slug}/testcase-visibility`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          visibility: visibility,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update test case visibility");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!canUserEditTestcases) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have permission to edit test cases for this problem.
          </p>
          <Button asChild>
            <Link href={`/problem/${slug}`}>
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
              Back to Problem
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/problem/${slug}`}>
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
            Back to Problem
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{problem.name}</h1>
          <p className="text-muted-foreground">Test Case Management</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="mb-6">
          <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
          <AlertDescription>
            Test case visibility updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Test Case Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
            Test Case Data Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Control who can see test case details (input, output, feedback) in submission results.
            This setting affects the visibility of test case data in submission pages.
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 space-y-0">
              <input
                type="radio"
                name="visibility"
                value="AUTHOR_ONLY"
                id="author-only"
                checked={visibility === 'AUTHOR_ONLY'}
                onChange={(e) => setVisibility(e.target.value as 'AUTHOR_ONLY' | 'EVERYONE')}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="author-only" className="flex items-center gap-2 text-base font-medium cursor-pointer">
                  <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-blue-600" />
                  Authors, Curators, and Testers Only
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only problem authors, curators, testers, and users with special permissions can see test case details.
                  Regular users will only see the overall verdict and score.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0">
              <input
                type="radio"
                name="visibility"
                value="EVERYONE"
                id="everyone"
                checked={visibility === 'EVERYONE'}
                onChange={(e) => setVisibility(e.target.value as 'AUTHOR_ONLY' | 'EVERYONE')}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="everyone" className="flex items-center gap-2 text-base font-medium cursor-pointer">
                  <FontAwesomeIcon icon={faGlobe} className="w-4 h-4 text-green-600" />
                  Everyone
                </Label>
                <p className="text-sm text-muted-foreground">
                  All users can see test case details including input, output, and feedback.
                  This is useful for educational problems where seeing test cases helps learning.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href={`/problem/${slug}`}>Cancel</Link>
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || visibility === problem.testcaseDataVisibility}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Important Notes</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• This setting only affects test case data visibility, not the submission results themselves</li>
                <li>• Authors, curators, and testers can always see test case details regardless of this setting</li>
                <li>• Changes take effect immediately for all existing and future submissions</li>
                <li>• Users with special permissions (EDIT_PROBLEM_TESTS) can also see test case details</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
