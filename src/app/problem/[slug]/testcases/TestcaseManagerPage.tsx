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
} from "@fortawesome/free-solid-svg-icons";
import JSZip from 'jszip';

interface TestcaseManagerPageProps {
  problem: IProblemPageData;
  slug: string;
}

type DetectedCase = {
  input: string;
  output?: string;
  type?: 'C' | 'S' | 'E' | string;
  points?: number | null;
  is_pretest?: boolean;
  generator_args?: string;
  output_limit?: number | null;
  output_prefix?: number | null;
  checker?: Record<string, unknown> | null;
};

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
  const [detectedCases, setDetectedCases] = useState<DetectedCase[]>([]);
  // Selection state for batch creation: map of detectedCases index -> selected
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  // Checker chooser state (mirror VNOI CHECKERS and allow custom args key)
  const [checkerChoice, setCheckerChoice] = useState<string>('standard');
  const checkerFileRef = useRef<HTMLInputElement | null>(null);
  const [checkerUploading, setCheckerUploading] = useState(false);
  const [checkerUploadMessage, setCheckerUploadMessage] = useState<string | null>(null);
  const [checkerInfo, setCheckerInfo] = useState<Record<string, unknown> | null>(null);
  const [checkerArgs, setCheckerArgs] = useState<Record<string, unknown> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  // Grader / IO global settings (match VNOI data.html fields)
  const [grader, setGrader] = useState<string | null>('standard');
  const [ioMethod, setIoMethod] = useState<string | null>('standard');
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
                      // Keep the full path (including folder) for pairing and display.
                      // Use the basename for regex matching, but include the directory
                      // in the pairing key so files in folders (e.g. "1/aplusb1.inp")
                      // are preserved as "1/aplusb1" keys and won't collide with
                      // identically named files in other folders.
                      const s = n.split("/").pop() || n;
                      const dir = n.includes("/") ? n.slice(0, n.lastIndexOf("/")) : "";
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
                        const idx = m[1] || '1';
                        const key = dir ? `${dir}/${idx}` : idx;
                        inputs[key] = n;
                      } else if ((m = s.match(numOut))) {
                        const idx = m[1] || '1';
                        const key = dir ? `${dir}/${idx}` : idx;
                        outputs[key] = n;
                      }
                    });

                    const cases: DetectedCase[] = [];
                    // Pair by key
                    Object.keys(inputs).forEach((k) => {
                      cases.push({ input: inputs[k], output: outputs[k], type: 'C', points: 1, is_pretest: false });
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
                  {/* Group by top-level folder (VNOI style). Empty string represents root files. */}
                  <div className="space-y-4">
                    {/** compute folder groups */}
                    {Object.entries(
                      detectedCases.reduce<Record<string, number[]>>((acc, _c, idx) => {
                        const p = detectedCases[idx].input || '';
                        const folder = p.includes('/') ? p.split('/')[0] : '';
                        (acc[folder] = acc[folder] || []).push(idx);
                        return acc;
                      }, {})
                    ).map(([folder, indices]) => (
                      <div key={folder} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={indices.every((i) => !!selected[i])}
                              onCheckedChange={(val) => {
                                const checked = !!val;
                                setSelected((s) => {
                                  const ns = { ...s };
                                  indices.forEach((i) => (ns[i] = checked));
                                  return ns;
                                });
                              }}
                            />
                            <span className="font-medium">{folder || 'root'}</span>
                            <span className="text-sm text-muted-foreground">({indices.length} files)</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="bg-yellow-50 text-yellow-800" onClick={() => {
                                // Toggle selection for this folder
                                const all = indices.every((i) => !!selected[i]);
                                setSelected((s) => {
                                  const ns = { ...s };
                                  indices.forEach((i) => (ns[i] = !all));
                                  return ns;
                                });
                              }}>Toggle</Button>
                              <Button size="sm" variant="outline" className="bg-green-50 text-green-700" onClick={() => {
                                // Group selected indices in this folder into a batch (preserve first case IO)
                                const sel = indices.filter((i) => !!selected[i]).sort((a,b)=>a-b);
                                if (sel.length < 2) return;
                                setDetectedCases((dc) => {
                                  const nc = [...dc];
                                  const first = sel[0];
                                  // preserve first's input/output but mark as batch start
                                  const preservedInput = nc[first]?.input ?? '';
                                  const preservedOutput = nc[first]?.output ?? '';
                                  nc[first] = { ...nc[first], type: 'S', input: preservedInput, output: preservedOutput };
                                  if (!nc[first].points) nc[first].points = 1;
                                  // middle -> C with null points and clear input/output
                                  for (let j = 1; j < sel.length; j++) {
                                    const idx = sel[j];
                                    nc[idx] = { ...nc[idx], type: j === sel.length - 1 ? 'E' : 'C', points: j === sel.length - 1 ? nc[idx].points : null, input: '', output: '' };
                                  }
                                  return nc;
                                });
                              }}>Group into Batch</Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {indices.map((i) => {
                            const c = detectedCases[i];
                            return (
                                <div key={i} className="flex items-center gap-2">
                                  <Checkbox checked={!!selected[i]} onCheckedChange={(v) => setSelected((s) => ({ ...s, [i]: !!v }))} />
                                  <input
                                    className="w-48 text-sm p-1 border rounded"
                                    value={c.input}
                                    onChange={(e) => {
                                      const nc = [...detectedCases];
                                      nc[i] = { ...nc[i], input: e.target.value };
                                      setDetectedCases(nc);
                                    }}
                                  />
                                  <input
                                    className="w-48 text-sm p-1 border rounded"
                                    value={c.output ?? ""}
                                    onChange={(e) => {
                                      const nc = [...detectedCases];
                                      nc[i] = { ...nc[i], output: e.target.value };
                                      setDetectedCases(nc);
                                    }}
                                  />
                                  <Select value={c.type || 'C'} onValueChange={(v) => {
                                    const nc = [...detectedCases];
                                    nc[i] = { ...nc[i], type: v };
                                    setDetectedCases(nc);
                                  }}>
                                    <SelectTrigger size="sm">
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
                                    value={c.points ?? ''}
                                    placeholder="points"
                                    onChange={(e) => {
                                      const nc = [...detectedCases];
                                      nc[i] = { ...nc[i], points: e.target.value ? Number(e.target.value) : null };
                                      setDetectedCases(nc);
                                    }}
                                    className="w-20 text-sm p-1 border rounded"
                                  />
                                  <div className="flex items-center gap-1 text-sm">
                                    <Checkbox checked={!!c.is_pretest} onCheckedChange={(v) => {
                                      const nc = [...detectedCases];
                                      nc[i] = { ...nc[i], is_pretest: !!v };
                                      setDetectedCases(nc);
                                    }} />
                                    <span className="text-sm">Pretest</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => {
                                      const nc = detectedCases.filter((_, idx) => idx !== i);
                                      setDetectedCases(nc);
                                      // remove selection for shifted indices
                                      setSelected((s) => {
                                        const ns: Record<number, boolean> = {};
                                        Object.keys(s).forEach((k) => {
                                          const ki = Number(k);
                                          if (ki < i) ns[ki] = s[ki];
                                          else if (ki > i) ns[ki - 1] = s[ki];
                                        });
                                        return ns;
                                      });
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grader / IO settings (compact) */}
              <div className="mt-4 border rounded p-3">
                <Label className="mb-2">Grader & IO Settings</Label>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-sm">Grader</div>
                      <div className="w-48">
                        <Select value={grader || 'standard'} onValueChange={(v) => setGrader(v)}>
                          <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="signature">Signature</SelectItem>
                            <SelectItem value="interactive">Interactive</SelectItem>
                            <SelectItem value="output_only">Output Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm">IO Method</div>
                      <div className="w-40">
                        <Select value={ioMethod || 'standard'} onValueChange={(v) => setIoMethod(v)}>
                          <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  {ioMethod === 'file' && (
                    <div className="flex items-center gap-2">
                      <div className="w-40">
                        <Input placeholder="input file" value={ioInputFile ?? ''} onChange={(e) => setIoInputFile(e.target.value)} />
                      </div>
                      <div className="w-40">
                        <Input placeholder="output file" value={ioOutputFile ?? ''} onChange={(e) => setIoOutputFile(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Checker chooser / upload */}
              <div className="mt-4">
                <Label className="mb-2">Checker</Label>
                <div className="flex items-center gap-4">
                  <div className="w-72">
                    <Select value={checkerChoice} onValueChange={(v) => setCheckerChoice(v)}>
                      <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="bridged">Bridged (custom file)</SelectItem>
                        <SelectItem value="floats">Floats (relative)</SelectItem>
                        <SelectItem value="floatsabs">Floats (absolute)</SelectItem>
                        <SelectItem value="floatsrel">Floats (relative)</SelectItem>
                        <SelectItem value="identical">Byte identical</SelectItem>
                        <SelectItem value="linecount">Line-by-line</SelectItem>
                        <SelectItem value="custom_args">Custom checker args</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {checkerChoice === 'bridged' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input ref={checkerFileRef} type="file" accept="*/*" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setCheckerUploading(true);
                      setCheckerUploadMessage(null);
                      try {
                        const form = new FormData();
                        form.append('file', f);
                        form.append('path', `tests/${slug}/${f.name}`);
                        const res = await fetch('/api/upload-checker', {
                          method: 'POST',
                          headers: {
                            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
                          },
                          body: form,
                        });
                        if (!res.ok) throw new Error('Upload failed');
                        const j = await res.json();
                        setCheckerInfo({ url: j.url, key: j.key, name: f.name });
                        setCheckerUploadMessage('Checker uploaded');
                      } catch (err) {
                        setCheckerUploadMessage((err as Error).message || 'Upload error');
                      } finally {
                        setCheckerUploading(false);
                      }
                    }} />
                    <Button size="sm" onClick={() => checkerFileRef.current?.click()}>Choose file</Button>
                    {checkerUploading && <span className="text-sm">Uploading...</span>}
                    {checkerUploadMessage && <span className="text-sm text-muted-foreground">{checkerUploadMessage}</span>}
                    {checkerInfo && <span className="text-sm">Uploaded: {String(((checkerInfo as unknown) as { name?: string }).name ?? '')}</span>}
                    <div className="ml-4 flex items-center gap-2">
                      <div className="text-sm">Checker subtype</div>
                      <div className="w-56">
                        <Select value={String(((checkerArgs || {}) as Record<string, unknown>).type || 'testlib')} onValueChange={(v) => setCheckerArgs({ ...(checkerArgs || {}), type: v })}>
                          <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="testlib">Testlib</SelectItem>
                            <SelectItem value="themis">Themis</SelectItem>
                            <SelectItem value="cms">CMS</SelectItem>
                            <SelectItem value="coci">COCI</SelectItem>
                            <SelectItem value="peg">PEG</SelectItem>
                            <SelectItem value="default">DMOJ (default)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!((checkerArgs || {}) as Record<string, unknown>).treat_checker_points_as_percentage} onChange={(e) => setCheckerArgs({ ...(checkerArgs || {}), treat_checker_points_as_percentage: e.target.checked })} />
                        Treat checker points as percentage
                      </label>
                    </div>
                  </div>
                )}

                {checkerChoice === 'floats' && (
                  <div className="mt-2 flex items-center gap-2">
                    <Label>Precision</Label>
                    <input type="number" min={0} value={Number(((checkerArgs as unknown) as { precision?: number }).precision) || 6} onChange={(e) => setCheckerArgs({ ...(checkerArgs||{}), precision: Number(e.target.value) })} className="w-20 p-1 border rounded" />
                  </div>
                )}

                {checkerChoice === 'custom' && (
                  <div className="mt-2">
                    <Label>Checker args (JSON)</Label>
                    <textarea value={JSON.stringify(checkerArgs || {}, null, 2)} onChange={(e) => {
                      try {
                        setCheckerArgs(JSON.parse(e.target.value));
                      } catch {
                        // ignore parse errors while editing
                      }
                    }} className="w-full p-2 border rounded text-sm" />
                  </div>
                )}
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
                  if (!sessionToken) return setUploadMessage('Login required');
                  setUploading(true);
                  setUploadMessage(null);
                  try {
                    // Always upload with fixed archive name 'archive.zip' to keep consistent naming
                    const form = new FormData();
                    form.append('file', f);
                    form.append('path', `tests/${slug}/archive.zip`);

                    const res = await fetch(`/api/upload-testcase-file`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${sessionToken}`,
                      },
                      body: form,
                    });
                    if (!res.ok) {
                      const e = await res.json().catch(() => ({}));
                      throw new Error(e?.error || 'Upload failed');
                    }
                    const j = await res.json();

                    // build finalize payload: include detectedCases, selectedIndices and checker
                    const selectedIndices = Object.keys(selected).filter((k) => selected[Number(k)]).map((k) => Number(k));
                    let checkerPayload: Record<string, unknown> | null = null;
                    if (!checkerChoice || checkerChoice === 'standard') checkerPayload = { name: 'standard' };
                    else if (checkerChoice === 'bridged') checkerPayload = checkerInfo ? { name: 'bridged', file: checkerInfo.name, url: checkerInfo.url, key: checkerInfo.key, args: checkerArgs || {} } : null;
                    else if (checkerChoice.startsWith('floats')) checkerPayload = { name: checkerChoice, args: checkerArgs || { precision: 6 } };
                    else if (checkerChoice === 'identical' || checkerChoice === 'linecount') checkerPayload = { name: checkerChoice };
                    else if (checkerChoice === 'custom_args') checkerPayload = { name: 'custom', args: checkerArgs || {} };

                    const payload = {
                      archive: 'archive.zip',
                      cases: detectedCases,
                      selectedIndices,
                      checker: checkerPayload,
                      archiveUrl: j.url,
                    };

                    const r = await fetch(`/api/problem/${slug}/finalize-testcase-upload`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
                      body: JSON.stringify(payload),
                    });
                    if (!r.ok) {
                      const err = await r.json().catch(() => ({}));
                      throw new Error(err?.error || 'Finalize failed');
                    }
                    const data = await r.json();
                    setUploadMessage(data.message || 'Finalize complete');
                  } catch (err) {
                    setUploadMessage((err as Error).message || 'Upload error');
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
