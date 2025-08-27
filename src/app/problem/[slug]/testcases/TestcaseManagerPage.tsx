"use client";

import React, { useState, useRef } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  faPlus,
  faGripLines,
} from "@fortawesome/free-solid-svg-icons";
import JSZip from "jszip";

interface TestcaseManagerPageProps {
  problem: IProblemPageData;
  slug: string;
}

type DetectedCase = {
  input: string;
  output?: string;
  type?: "C" | "S" | "E" | string;
  points?: number | null;
  is_pretest?: boolean;
  generator_args?: string;
  output_limit?: number | null;
  output_prefix?: number | null;
  checker?: Record<string, unknown> | null;
};

// Define a type for the archive objects
interface Archive {
  id: number;
  url: string;
  filename: string;
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
  const [detectedCases, setDetectedCases] = useState<DetectedCase[]>([]);
  const [allZipFiles, setAllZipFiles] = useState<string[]>([]);
  const [batchStarts, setBatchStarts] = useState<string>("");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  // Checker chooser state (mirror VNOI CHECKERS and allow custom args key)
  const [checkerChoice, setCheckerChoice] = useState<string>("standard");
  const checkerFileRef = useRef<HTMLInputElement | null>(null);
  const [checkerUploading, setCheckerUploading] = useState(false);
  const [checkerUploadMessage, setCheckerUploadMessage] = useState<
    string | null
  >(null);
  const [checkerInfo, setCheckerInfo] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [checkerArgs, setCheckerArgs] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
    // Deletion / undo state
    // pendingDeletes stores timeout ids keyed by a temporary uid for the removal action
    const [pendingDeletes, setPendingDeletes] = useState<Record<string, number>>({});
    // toast controls and animation state
    const [toast, setToast] = useState<{
      open: boolean;
      message: string;
      caseIdx: number | null;
      anim: "in" | "out" | null;
      uid: string | null; // uid of the pending deletion
    }>({ open: false, message: "", caseIdx: null, anim: null, uid: null });
    const [restoredIdx, setRestoredIdx] = useState<number | null>(null);
    // Keep a backup of last-removed case so we can restore on undo
    const lastRemovedRef = useRef<{ idx: number; item: DetectedCase } | null>(null);

    const scheduleRemoval = (idx: number) => {
      // Immediately remove from UI and keep a backup so Undo can restore
      const item = detectedCases[idx];
      lastRemovedRef.current = { idx, item };

      setDetectedCases((prev) => prev.filter((_, i) => i !== idx));

      // show toast sliding in
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToast({ open: true, message: `Testcase ${idx + 1} removed`, caseIdx: idx, anim: "in", uid });

      const timeoutId = window.setTimeout(() => {
        // begin slide-out animation then finalize
        setToast((t) => (t.uid === uid ? { ...t, anim: "out" } : t));
        // wait for animation (200ms) then finalize
        const finalizeTimer = window.setTimeout(() => {
          finalizeRemoval(uid);
        }, 220);
        setPendingDeletes((p) => ({ ...p, [uid]: finalizeTimer }));
      }, 3000);

      // store initial timeout so we can cancel finalize when Undo is pressed
      setPendingDeletes((p) => ({ ...p, [uid]: timeoutId }));
    };

    const undoRemoval = (uid: string | null) => {
      if (!uid) return;
      // cancel any scheduled timeouts (both initial and finalize)
      const t = pendingDeletes[uid];
      if (t) {
        clearTimeout(t);
      }
      // also clear any nested finalize timer stored under same uid
      setPendingDeletes((p) => {
        const np = { ...p };
        if (np[uid]) {
          clearTimeout(np[uid]);
          delete np[uid];
        }
        return np;
      });

      // restore immediately from backup
      const last = lastRemovedRef.current;
      if (last) {
        setDetectedCases((prev) => {
          const out = [...prev];
          // if index is out of range, push to end
          const insertAt = Math.min(Math.max(0, last.idx), out.length);
          out.splice(insertAt, 0, last.item);
          return out;
        });
        setRestoredIdx(last.idx);
        // clear backup
        lastRemovedRef.current = null;
        // hide toast immediately
        setToast({ open: false, message: "", caseIdx: null, anim: null, uid: null });
        setTimeout(() => setRestoredIdx(null), 400);
      }
    };

    const finalizeRemoval = (uid: string) => {
      // clear any pending timers for this uid and remove backup
      setPendingDeletes((p) => {
        const np = { ...p };
        if (np[uid]) {
          clearTimeout(np[uid]);
          delete np[uid];
        }
        return np;
      });
      // clear backup (we won't restore)
      lastRemovedRef.current = null;
      // hide toast
      setToast({ open: false, message: "", caseIdx: null, anim: null, uid: null });
    };
  // IO global settings (match LQDOJ data.html fields)
  const [ioInputFile, setIoInputFile] = useState<string | null>(null);
  const [ioOutputFile, setIoOutputFile] = useState<string | null>(null);

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
          <p className="text-muted-foreground">
            Test Case Visibilty Management
          </p>
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
                    const names = Object.keys(zip.files).filter(
                      (n) => !n.endsWith("/")
                    );

                    // Store all files for selectors
                    setAllZipFiles(names);

                    // Lightweight auto-detection (VNOI-like): find pairs like *.in, *.out or inputN.txt, outputN.txt
                    const inputs: Record<string, string> = {};
                    const outputs: Record<string, string> = {};
                    const simpleIn = /(?:^|\/)(.+?)\.(?:in|input|inp)$/i;
                    const simpleOut = /(?:^|\/)(.+?)\.(?:out|output|ans|exp)$/i;
                    const numIn = /(?:^|\/)input(?:[_\-.]?)(\d+)?(?:\.|$)/i;
                    const numOut = /(?:^|\/)output(?:[_\-.]?)(\d+)?(?:\.|$)/i;

                    names.forEach((n) => {
                      // Keep the full path (including folder) for pairing and display.
                      // Use the basename for regex matching, but include the directory
                      // in the pairing key so files in folders (e.g. "1/aplusb1.inp")
                      // are preserved as "1/aplusb1" keys and won't collide with
                      // identically named files in other folders.
                      const s = n.split("/").pop() || n;
                      const dir = n.includes("/")
                        ? n.slice(0, n.lastIndexOf("/"))
                        : "";
                      let m;
                      if ((m = s.match(simpleIn))) {
                        const base = m[1];
                        const key = dir ? `${dir}/${base}` : base;
                        inputs[key] = n;
                      } else if ((m = s.match(simpleOut))) {
                        const base = m[1];
                        const key = dir ? `${dir}/${base}` : base;
                        outputs[key] = n;
                      } else if ((m = s.match(numIn))) {
                        const idx = m[1] || "1";
                        const key = dir ? `${dir}/${idx}` : idx;
                        inputs[key] = n;
                      } else if ((m = s.match(numOut))) {
                        const idx = m[1] || "1";
                        const key = dir ? `${dir}/${idx}` : idx;
                        outputs[key] = n;
                      }
                    });

                    const cases: DetectedCase[] = [];
                    // Pair by key
                    Object.keys(inputs).forEach((k) => {
                      cases.push({
                        input: inputs[k],
                        output: outputs[k],
                        type: "C",
                        points: 1,
                        is_pretest: false,
                      });
                    });
                    // Add outputs that were unmatched as separate cases
                    Object.keys(outputs).forEach((k) => {
                      if (!inputs[k])
                        cases.push({
                          input: outputs[k],
                          output: undefined,
                          type: "output-only",
                        });
                    });

                    if (cases.length > 0) setDetectedCases(cases);
                  } catch (err) {
                    console.error("Failed to read zip archive", err);
                    setUploadMessage("Failed to read zip archive");
                  }
                }}
              />
            </div>
            {zipName && (
              <div>
                <p className="text-sm">Selected: {zipName}</p>
                {/* If the problem already has an uploaded archive, show it as a download link */}
                {problem.archives && problem.archives.length > 0 && (
                  <div className="text-sm mt-1">
                    Existing files:
                    {problem.archives.map((a: Archive) => (
                      <div key={a.id}>
                        <a
                          className="text-blue-600 underline"
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {a.filename}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {detectedCases.length > 0 && (
              <div className="mt-4">
                <Label className="mb-2">Detected testcases</Label>
                <div className="space-y-2">
                  {detectedCases.map((c, i) => (
                    <div
                      key={i}
                      className={`flex flex-wrap items-center gap-2 p-2 border rounded ${
                        dragOverIdx === i ? "bg-blue-100" : ""
                      } ${restoredIdx === i ? "animate-pulse" : ""}`}
                      draggable
                      onDragStart={() => setDraggedIdx(i)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverIdx(i);
                      }}
                      onDrop={() => {
                        if (draggedIdx === null || draggedIdx === i) return;
                        const nc = [...detectedCases];
                        const [removed] = nc.splice(draggedIdx, 1);
                        nc.splice(i, 0, removed);
                        setDetectedCases(nc);
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      style={{ cursor: "grab" }}
                    >
                      {/* Drag handle */}
                      <span
                        className="px-2 cursor-grab text-gray-500 flex-shrink-0"
                        title="Drag to reorder"
                        style={{ userSelect: "none" }}
                      >
                        <FontAwesomeIcon icon={faGripLines} />
                      </span>
                      <span className="font-mono text-xs w-6 text-center flex-shrink-0">
                        {i + 1}
                      </span>
                      {c.type !== "S" && c.type !== "E" && (
                        <>
                          <div className="min-w-0">
                            <input
                              list={`files-input-${i}`}
                              value={c.input ?? ""}
                              onChange={(e) => {
                                const nc = [...detectedCases];
                                nc[i] = { ...nc[i], input: e.target.value };
                                setDetectedCases(nc);
                              }}
                              className="w-48 max-w-[40vw] p-1 border rounded min-w-0"
                              placeholder="Select input file"
                            />
                            <datalist id={`files-input-${i}`}>
                              {allZipFiles.map((file) => (
                                <option key={file} value={file} />
                              ))}
                            </datalist>
                          </div>
                          <div className="min-w-0">
                            <input
                              list={`files-output-${i}`}
                              value={c.output ?? ""}
                              onChange={(e) => {
                                const nc = [...detectedCases];
                                nc[i] = {
                                  ...nc[i],
                                  output: e.target.value ? e.target.value : undefined,
                                };
                                setDetectedCases(nc);
                              }}
                              className="w-48 max-w-[40vw] p-1 border rounded min-w-0"
                              placeholder="Select output file (leave empty for none)"
                            />
                            <datalist id={`files-output-${i}`}>
                              {allZipFiles.map((file) => (
                                <option key={file} value={file} />
                              ))}
                            </datalist>
                          </div>
                        </>
                      )}
                      <Select
                        value={c.type || "C"}
                        onValueChange={(v) => {
                          const nc = [...detectedCases];
                          nc[i] = { ...nc[i], type: v };
                          setDetectedCases(nc);
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="C">Case (C)</SelectItem>
                          <SelectItem value="S">Batch start (S)</SelectItem>
                          <SelectItem value="E">Batch end (E)</SelectItem>
                        </SelectContent>
                      </Select>
                      <input
                        type="number"
                        min={0}
                        value={c.points ?? ""}
                        placeholder="points"
                        onChange={(e) => {
                          const nc = [...detectedCases];
                          nc[i] = {
                            ...nc[i],
                            points: e.target.value
                              ? Number(e.target.value)
                              : null,
                          };
                          setDetectedCases(nc);
                        }}
                        className="w-20 text-sm p-1 border rounded"
                      />
                      <div className="flex items-center gap-1 text-sm">
                        <Checkbox
                          checked={!!c.is_pretest}
                          onCheckedChange={(v) => {
                            const nc = [...detectedCases];
                            nc[i] = { ...nc[i], is_pretest: !!v };
                            setDetectedCases(nc);
                          }}
                        />
                        <span className="text-sm">Pretest</span>
                      </div>
                      {/* Replace Delete with undoable 'x' (larger) */}
                      <button
                        aria-label={`Remove testcase ${i + 1}`}
                        title="Remove"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                        onClick={() => scheduleRemoval(i)}
                      >
                        <span className="text-lg leading-none">×</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 w-7 h-7 p-0"
                        onClick={() => {
                          const newCase: DetectedCase = {
                            input: "",
                            output: "",
                            type: "C",
                            points: 1,
                            is_pretest: false,
                          };
                          const nc = [...detectedCases];
                          nc.splice(i + 1, 0, newCase);
                          setDetectedCases(nc);
                        }}
                        title="Add testcase after"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add new testcase button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const newCase: DetectedCase = {
                      input: "",
                      output: "",
                      type: "C",
                      points: 1,
                      is_pretest: false,
                    };
                    setDetectedCases([...detectedCases, newCase]);
                  }}
                >
                  Add Testcase
                </Button>

                {/* Batch configuration */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Batch Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-sm">Batch start positions:</Label>
                      <Input
                        value={batchStarts}
                        onChange={(e) => setBatchStarts(e.target.value)}
                        placeholder="e.g., 1, 5, 9"
                        className="mt-1"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave empty if not using batches. If you want to divide
                      into three batches [1, 4], [5, 8], [9, 10], enter: 1, 5, 9
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        // Parse batchStarts string into array of indices
                        const starts = batchStarts
                          .split(",")
                          .map((s) => parseInt(s.trim(), 10))
                          .filter((n) => !isNaN(n) && n > 0);
                        if (starts.length === 0) return;
                        // Always sort and deduplicate
                        const batchIndices = Array.from(new Set(starts)).sort(
                          (a, b) => a - b
                        );
                        const origCases = [...detectedCases];
                        const newCases: DetectedCase[] = [];
                        for (let b = 0; b < batchIndices.length; b++) {
                          const start = batchIndices[b] - 1;
                          const end =
                            b + 1 < batchIndices.length
                              ? batchIndices[b + 1] - 2
                              : origCases.length - 1;
                          if (start > origCases.length - 1) break;
                          // Insert S
                          newCases.push({ ...origCases[start], type: "S" });
                          // Insert only the testcase at start
                          newCases.push({ ...origCases[start], type: "C" });
                          // Insert remaining cases in batch
                          for (
                            let i = start + 1;
                            i <= end && i < origCases.length;
                            i++
                          ) {
                            newCases.push({ ...origCases[i], type: "C" });
                          }
                          // Insert E
                          newCases.push({
                            ...origCases[end >= start ? end : start],
                            type: "E",
                          });
                        }
                        setDetectedCases(newCases);
                      }}
                    >
                      Apply Batch
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Checker + IO settings */}
            <div className="mt-4 border rounded p-3">
              <Label className="mb-2">Checker & IO Settings</Label>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm">Checker</div>
                  <div className="w-64">
                    <Select
                      value={checkerChoice}
                      onValueChange={(v) => setCheckerChoice(v)}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="floats">Floats</SelectItem>
                        <SelectItem value="floatsabs">
                          Floats (absolute)
                        </SelectItem>
                        <SelectItem value="floatsrel">
                          Floats (relative)
                        </SelectItem>
                        <SelectItem value="rstripped">
                          Non-trailing spaces
                        </SelectItem>
                        <SelectItem value="sorted">Unordered</SelectItem>
                        <SelectItem value="identical">
                          Byte identical
                        </SelectItem>
                        <SelectItem value="linecount">Line-by-line</SelectItem>
                        <SelectItem value="custom">
                          Custom checker (PY)
                        </SelectItem>
                        <SelectItem value="customcpp">
                          Custom checker (CPP)
                        </SelectItem>
                        <SelectItem value="interact">Interactive</SelectItem>
                        <SelectItem value="testlib">Testlib</SelectItem>
                        <SelectItem value="interacttl">
                          Interactive (Testlib)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Upload UI for choices that need a file */}
                  {(checkerChoice === "testlib" ||
                    checkerChoice === "custom" ||
                    checkerChoice === "customcpp" ||
                    checkerChoice === "interact" ||
                    checkerChoice === "interacttl") && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        ref={checkerFileRef}
                        type="file"
                        accept="*/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setCheckerUploading(true);
                          setCheckerUploadMessage(null);
                          try {
                            const form = new FormData();
                            form.append("file", f);
                            form.append("path", `tests/${slug}/${f.name}`);
                            const res = await fetch("/api/upload-checker", {
                              method: "POST",
                              headers: {
                                ...(sessionToken
                                  ? { Authorization: `Bearer ${sessionToken}` }
                                  : {}),
                              },
                              body: form,
                            });
                            if (!res.ok) throw new Error("Upload failed");
                            const j = await res.json();
                            setCheckerInfo({
                              url: j.url,
                              key: j.key,
                              name: f.name,
                            });
                            setCheckerUploadMessage("Checker uploaded");
                          } catch (err) {
                            setCheckerUploadMessage(
                              (err as Error).message || "Upload error"
                            );
                          } finally {
                            setCheckerUploading(false);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => checkerFileRef.current?.click()}
                      >
                        Choose file
                      </Button>
                      {checkerUploading && (
                        <span className="text-sm">Uploading...</span>
                      )}
                      {checkerUploadMessage && (
                        <span className="text-sm text-muted-foreground">
                          {checkerUploadMessage}
                        </span>
                      )}
                      {checkerInfo && (
                        <span className="text-sm">
                          Uploaded:{" "}
                          {String(
                            (checkerInfo as unknown as { name?: string })
                              .name ?? ""
                          )}
                        </span>
                      )}
                      {/* If problem has stored archives or checkers, display them */}
                      {problem.archives && problem.archives.length > 0 && (
                        <div className="text-sm">
                          {problem.archives.map((a: Archive) => (
                            <div key={a.id}>
                              <a
                                className="text-blue-600 underline"
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {a.filename}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Precision box for floats family (default 6) */}
                  {checkerChoice && checkerChoice.startsWith("floats") && (
                    <div className="mt-2 flex items-center gap-2">
                      <Label>Precision</Label>
                      <input
                        type="number"
                        min={0}
                        value={Number(
                          (checkerArgs as unknown as { precision?: number })
                            .precision ?? 6
                        )}
                        onChange={(e) =>
                          setCheckerArgs({
                            ...(checkerArgs || {}),
                            precision: Number(e.target.value),
                          })
                        }
                        className="w-20 p-1 border rounded"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 ms-auto">
                  <div className="w-48">
                    <Label className="text-sm">Input file (optional)</Label>
                    <Input
                      placeholder="filename or leave empty"
                      value={ioInputFile ?? ""}
                      onChange={(e) => setIoInputFile(e.target.value || null)}
                      className="mt-1"
                    />
                  </div>
                  <div className="w-48">
                    <Label className="text-sm">Output file (optional)</Label>
                    <Input
                      placeholder="filename or leave empty"
                      value={ioOutputFile ?? ""}
                      onChange={(e) => setIoOutputFile(e.target.value || null)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Leave the input field empty to use stdin. Leave the output
                  field empty to use stdout.
                </p>
              </div>
            </div>

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
                  if (!sessionToken) return setUploadMessage("Login required");
                  setUploading(true);
                  setUploadMessage(null);
                  try {
                    // Always upload with fixed archive name 'archive.zip' to keep consistent naming
                    const form = new FormData();
                    form.append("file", f);
                    form.append("path", `tests/${slug}/archive.zip`);

                    const res = await fetch(`/api/upload-testcase-file`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${sessionToken}`,
                      },
                      body: form,
                    });
                    if (!res.ok) {
                      const e = await res.json().catch(() => ({}));
                      throw new Error(e?.error || "Upload failed");
                    }
                    const j = await res.json();

                    // build finalize payload: include detectedCases and checker
                    let checkerPayload: Record<string, unknown> | null = null;
                    if (!checkerChoice || checkerChoice === "standard") {
                      checkerPayload = { name: "standard" };
                    } else if (
                      checkerChoice === "testlib" ||
                      checkerChoice === "custom" ||
                      checkerChoice === "customcpp"
                    ) {
                      // uploaded file should be in checkerInfo and we send bridged-style payload with basename
                      if (checkerInfo) {
                        const basename = String(
                          (checkerInfo as unknown as Record<string, unknown>)
                            .name || ""
                        )
                          .split("/")
                          .pop();
                        checkerPayload = {
                          name: "bridged",
                          key: checkerInfo.key,
                          url: checkerInfo.url,
                          args: {
                            ...(checkerArgs || {}),
                            files: basename,
                            type:
                              checkerChoice === "testlib"
                                ? "testlib"
                                : undefined,
                          },
                        };
                      }
                    } else if (
                      checkerChoice === "interact" ||
                      checkerChoice === "interacttl"
                    ) {
                      // interactive types: if a file was uploaded, include it so backend can use basename
                      if (checkerInfo) {
                        const basename = String(
                          (checkerInfo as unknown as Record<string, unknown>)
                            .name || ""
                        )
                          .split("/")
                          .pop();
                        checkerPayload = {
                          name: checkerChoice,
                          key: checkerInfo.key,
                          url: checkerInfo.url,
                          args: { ...(checkerArgs || {}), files: basename },
                        };
                      } else {
                        checkerPayload = { name: checkerChoice };
                      }
                    } else if (checkerChoice.startsWith("floats")) {
                      checkerPayload = {
                        name: "floats",
                        args: {
                          precision: Number(
                            (checkerArgs as unknown as { precision?: number })
                              .precision ?? 6
                          ),
                        },
                      };
                    } else if (
                      checkerChoice === "identical" ||
                      checkerChoice === "linecount"
                    ) {
                      checkerPayload = { name: checkerChoice };
                    } else if (checkerChoice === "custom_args") {
                      checkerPayload = {
                        name: "custom",
                        args: checkerArgs || {},
                      };
                    }

                    const payload = {
                      archive: "archive.zip",
                      cases: detectedCases,
                      batchStarts: batchStarts,
                      checker: checkerPayload,
                      ioInputFile: ioInputFile,
                      ioOutputFile: ioOutputFile,
                      archiveUrl: j.url,
                    };

                    const r = await fetch(
                      `/api/problem/${slug}/finalize-testcase-upload`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${sessionToken}`,
                        },
                        body: JSON.stringify(payload),
                      }
                    );
                    if (!r.ok) {
                      const err = await r.json().catch(() => ({}));
                      throw new Error(err?.error || "Finalize failed");
                    }
                    const data = await r.json();
                    setUploadMessage(data.message || "Finalize complete");
                  } catch (err) {
                    setUploadMessage((err as Error).message || "Upload error");
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading || !zipName}
              >
                {uploading ? "Uploading..." : "Upload & Finalize"}
              </Button>
              {/* single action: upload archive then finalize */}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Toast area */}
      {toast.open && (
        <div className="fixed top-4 right-4 z-50">
          <div className="max-w-xs bg-white border border-gray-200 rounded-xl shadow-lg p-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-700">{toast.message}</p>
              <div className="ms-auto flex items-center gap-2">
                <button
                  className="text-sm text-blue-600"
                  onClick={() => undoRemoval(toast.uid)}
                >
                  Undo
                </button>
                <button
                  className="text-sm text-gray-500"
                  onClick={() => {
                    // If we have a uid for the pending deletion, cancel the initial timeout
                    // and run the slide-out animation, then finalize immediately (after animation).
                    const uid = toast.uid;
                    if (uid) {
                      // Cancel any scheduled timers (initial or finalize) stored for this uid
                      setPendingDeletes((p) => {
                        const np = { ...p } as Record<string, number>;
                        if (np[uid]) {
                          try {
                            clearTimeout(np[uid]);
                          } catch {}
                          delete np[uid];
                        }
                        return np;
                      });

                      // Trigger slide-out animation
                      setToast((t) => (t.uid === uid ? { ...t, anim: "out" } : t));

                      // Finalize after the animation completes
                      setTimeout(() => finalizeRemoval(uid), 220);
                    } else {
                      setToast({ open: false, message: "", caseIdx: null, anim: null, uid: null });
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
