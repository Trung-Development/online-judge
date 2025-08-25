"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
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
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import JSZip from 'jszip';

interface TestcaseManagerPageProps {
  problem: IProblemPageData;
  slug: string;
}

export default function TestcaseManagerPage({
  problem,
  slug,
}: TestcaseManagerPageProps) {
  const { user, sessionToken } = useAuth();
  // const router = useRouter();

  const [visibility, setVisibility] = useState<
    "AUTHOR_ONLY" | "AC_ONLY" | "EVERYONE"
  >(problem.testcaseDataVisibility || "AUTHOR_ONLY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ZIP upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [zipName, setZipName] = useState<string | null>(null);
  const [zipFiles, setZipFiles] = useState<string[]>([]);
  const [detectedCases, setDetectedCases] = useState<{
    input: string;
    output?: string;
    type?: string;
  }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Check if current user can edit test cases
  const canUserEditTestcases =
    user &&
    canEditProblemTestcases(
      user.perms,
      problem.author || [],
      problem.curator || [],
      problem.tester || [],
      user.id
    );

  // Redirect if user doesn't have permission
  // useEffect(() => {
  //   if (!canUserEditTestcases) {
  //     router.push(`/problem/${slug}`);
  //   }
  // }, [canUserEditTestcases, router, slug, loading]);

  const handleSave = async () => {
    if (!sessionToken) {
      setError("You must be logged in to make changes.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/problem/${slug}/testcase-visibility`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          visibility: visibility,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === "INSUFFICIENT_PERMISSIONS")
          throw new Error(
            "You are not authorized to perform this operation. Please try again later."
          );
        if (errorData.error === "PROBLEM_NOT_FOUND")
          throw new Error(
            "The problem you are trying to access does not exist. Please check the URL and try again."
          );
        if (errorData.error === "PROBLEM_LOCKED")
          throw new Error(
            "Modifications to this problem are restricted. Please contact an administrator for further assistance."
          );
        throw new Error(
          errorData.error || "Failed to update test case visibility"
        );
      } else {
        problem.testcaseDataVisibility = visibility;
        setVisibility(visibility);
      }

      setSuccess(true);
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
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="w-12 h-12 text-red-500 mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have the permission to edit test cases for this
            problem.
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
          <p className="text-muted-foreground">Test Case Visibilty Management</p>
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
        <Alert variant="success" className="mb-6">
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
            Control who can see test case details (input, output, feedback) in
            submission results. This setting affects the visibility of test case
            data in submission pages.
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 space-y-0">
              <input
                type="radio"
                name="visibility"
                value="AUTHOR_ONLY"
                id="author-only"
                checked={visibility === "AUTHOR_ONLY"}
                onChange={(e) =>
                  setVisibility(
                    e.target.value as "AUTHOR_ONLY" | "AC_ONLY" | "EVERYONE"
                  )
                }
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="author-only"
                  className="flex items-center gap-2 text-base font-medium cursor-pointer"
                >
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="w-4 h-4 text-blue-600"
                  />
                  Problem Moderators
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only problem authors, curators, testers, and users with
                  special permissions can see test case details. Regular users
                  will only see the overall verdict and score.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0">
              <input
                type="radio"
                name="visibility"
                value="AC_ONLY"
                id="ac-only"
                checked={visibility === "AC_ONLY"}
                onChange={(e) =>
                  setVisibility(
                    e.target.value as "AUTHOR_ONLY" | "AC_ONLY" | "EVERYONE"
                  )
                }
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="ac-only"
                  className="flex items-center gap-2 text-base font-medium cursor-pointer"
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="w-4 h-4 text-yellow-600"
                  />
                  Accepted Users Only
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only users who have successfully solved the problem can view
                  test case details, including inputs, outputs, and feedback.
                  Other users will only see the overall verdict and score.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0">
              <input
                type="radio"
                name="visibility"
                value="EVERYONE"
                id="everyone"
                checked={visibility === "EVERYONE"}
                onChange={(e) =>
                  setVisibility(
                    e.target.value as "AUTHOR_ONLY" | "AC_ONLY" | "EVERYONE"
                  )
                }
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="everyone"
                  className="flex items-center gap-2 text-base font-medium cursor-pointer"
                >
                  <FontAwesomeIcon
                    icon={faGlobe}
                    className="w-4 h-4 text-green-600"
                  />
                  Everyone
                </Label>
                <p className="text-sm text-muted-foreground">
                  All users can see test case details including input, output,
                  and feedback. This is useful for educational problems where
                  seeing test cases helps learning.
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
              disabled={
                loading || visibility === problem.testcaseDataVisibility
              }
            >
              {loading ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="w-4 h-4 mr-2 animate-spin"
                  />
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

      {/* ZIP Upload Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5" />
            Upload Testcase Archive (ZIP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="mb-2">ZIP archive (.zip)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (!f.name.endsWith(".zip")) {
                    setUploadMessage("Only .zip archives are supported");
                    return;
                  }
                  setZipName(f.name);
                  setUploadMessage(null);
                  try {
                    const buf = await f.arrayBuffer();
                    const zip = await JSZip.loadAsync(buf);
                    const names = Object.keys(zip.files).filter((n) => !n.endsWith("/"));
                    setZipFiles(names);

                    // Lightweight auto-detection (VNOI-like): find pairs like *.in, *.out or inputN.txt, outputN.txt
                    const inputs: Record<string, string> = {};
                    const outputs: Record<string, string> = {};
                    const simpleIn = /(?:^|\/)(.+?)\.(?:in|input|inp)$/i;
                    const simpleOut = /(?:^|\/)(.+?)\.(?:out|output|ans|exp)$/i;
                    const numIn = /(?:^|\/)input(?:[_\-.]?)(\d+)?(?:\.|$)/i;
                    const numOut = /(?:^|\/)output(?:[_\-.]?)(\d+)?(?:\.|$)/i;

                    names.forEach((n) => {
                      const s = n.split("/").pop() || n;
                      let m;
                      if ((m = s.match(simpleIn))) {
                        inputs[m[1]] = n;
                      } else if ((m = s.match(simpleOut))) {
                        outputs[m[1]] = n;
                      } else if ((m = s.match(numIn))) {
                        const idx = m[1] || '1';
                        inputs[idx] = n;
                      } else if ((m = s.match(numOut))) {
                        const idx = m[1] || '1';
                        outputs[idx] = n;
                      }
                    });

                    const cases: { input: string; output?: string; type?: string }[] = [];
                    // Pair by key
                    Object.keys(inputs).forEach((k) => {
                      cases.push({ input: inputs[k], output: outputs[k], type: 'standard' });
                    });
                    // Add outputs that were unmatched as separate cases
                    Object.keys(outputs).forEach((k) => {
                      if (!inputs[k]) cases.push({ input: outputs[k], output: undefined, type: 'output-only' });
                    });

                    if (cases.length > 0) setDetectedCases(cases);
                  } catch (err) {
                    console.error('Failed to read zip archive', err);
                    setUploadMessage("Failed to read zip archive");
                    setZipFiles([]);
                  }
                }}
              />
            </div>

            {zipName && (
              <div>
                <p className="text-sm">Selected: {zipName}</p>
                <p className="text-sm text-muted-foreground">Contents:</p>
                <ul className="list-disc pl-6">
                  {zipFiles.map((f) => (
                    <li key={f} className="text-sm">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

              {detectedCases.length > 0 && (
                <div className="mt-4">
                  <Label className="mb-2">Detected testcases</Label>
                  <div className="space-y-2">
                    {detectedCases.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          className="flex-1 text-sm p-1 border rounded"
                          value={c.input}
                          onChange={(e) => {
                            const nc = [...detectedCases];
                            nc[i] = { ...nc[i], input: e.target.value };
                            setDetectedCases(nc);
                          }}
                        />
                        <input
                          className="flex-1 text-sm p-1 border rounded"
                          value={c.output ?? ""}
                          onChange={(e) => {
                            const nc = [...detectedCases];
                            nc[i] = { ...nc[i], output: e.target.value };
                            setDetectedCases(nc);
                          }}
                        />
                        <span className="text-xs text-muted-foreground">{c.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {uploadMessage && (
              <Alert variant="destructive">
                <AlertDescription>{uploadMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Choose ZIP
              </Button>
              <Button
                onClick={async () => {
                  const f = fileInputRef.current?.files?.[0];
                  if (!f) {
                    setUploadMessage("No file selected");
                    return;
                  }
                  setUploading(true);
                  setUploadMessage(null);
                  try {
                    const form = new FormData();
                    form.append("file", f);
                    // store under tests/<slug>/ on object storage
                    form.append("path", `tests/${slug}/${f.name}`);

                      // Request presigned URLs from our app route. We pass JSON (not multipart)
                      const presignRes = await fetch(`/api/upload-testcase-file`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
                        },
                        body: JSON.stringify({ slug, filename: f.name }),
                      });

                      if (!presignRes.ok) throw new Error('Failed to get presigned URL');
                      const presign = await presignRes.json();

                      // Upload directly to object storage using the returned uploadUrl
                      const putRes = await fetch(presign.uploadUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/zip' },
                        body: f,
                      });

                      if (!putRes.ok) throw new Error('Upload to storage failed');

                      // Finalize by notifying backend with the download URL (presigned GET)
                      const fin = await fetch(`/api/problem/${slug}/finalize-testcase-upload`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
                        },
                        body: JSON.stringify({ url: presign.downloadUrl || presign.download_url || presign.downloadUrl || presign.download }),
                      });

                      if (!fin.ok) {
                        const err = await fin.json().catch(() => ({}));
                        throw new Error(err?.error || 'Finalize failed');
                      }

                      const fj = await fin.json();
                      setUploadMessage(fj.message || 'Upload & finalize complete');
                    // Optionally trigger a refresh of problem metadata here
                  } catch (error) {
                    const msg =
                      error && typeof error === 'object' && 'message' in error
                        ? (error as { message?: string }).message
                        : String(error);
                    setUploadMessage(msg || "Upload error");
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading || !zipName}
              >
                {uploading ? "Uploading..." : "Upload & Finalize"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Info Card */}
      <Card className="mt-6">
        <CardContent className="flex items-start gap-4">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="w-6 h-6 mt-1 flex-shrink-0"
          />
          <div className="space-y-2">
            <h3 className="font-semibold text-base">Important Notes</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>
                This setting only affects test case data visibility, not the
                submission results themselves
              </li>
              <li>
                Authors, curators, and testers can always see test case details
                regardless of this setting
              </li>
              <li>
                Changes take effect immediately for all existing and future
                submissions
              </li>
              <li>
                Users with edit problem tests permission can also see test case
                details
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
