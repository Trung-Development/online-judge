"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/AuthProvider";
import JSZip from "jszip";

export default function ImportCodeforcesPolygonPage() {
  const { sessionToken } = useAuth();
  const [zipName, setZipName] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [ignoreZeroPointBatches, setIgnoreZeroPointBatches] = useState(false);
  const [ignoreZeroPointCases, setIgnoreZeroPointCases] = useState(false);
  type ParsedPackage = {
    problemName: string;
    timeLimit: number;
    memoryLimit: number;
    isInteractive: boolean;
    testsZipBlob: Blob;
    // cases array formatted for finalize: entries may be case objects or batch markers
    detectedCases: Array<CaseOrBatch>;
    // raw parsed batches and cases for debugging
    batches: Array<{ name: string; points: number; cases: string[] }>;
    rawCases: Array<{
      inputFile: string;
      outputFile: string;
      points: number;
      group: string;
    }>;
    checkerFile: File | null;
    finalDescription: string;
  };

  type CaseOrBatch = CaseObj | BatchStart | BatchEnd;

  type CaseObj = { input: string; output: string; points?: number };
  type BatchStart = { type: "S"; points: number };
  type BatchEnd = { type: "E" };
  type UploadedInfo = { url?: string; key?: string; name?: string };

  const [parsedPackage, setParsedPackage] = useState<ParsedPackage | null>(
    null
  );
  const [uploadedArchive, setUploadedArchive] = useState<UploadedInfo | null>(
    null
  );
  const [uploadedChecker, setUploadedChecker] = useState<UploadedInfo | null>(
    null
  );
  // debug mode removed in production

  const texToMarkdownFallback = (tex: string) => {
    if (!tex) return "";
    // Preserve math environments ($...$, $$...$$) untouched so KaTeX can render them.
    // We'll only transform structural and simple text macros outside math.
    let s = tex;

    // Temporarily protect math regions
    const mathRegions: string[] = [];
    s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, g1) => {
      const token = `@@MATH${mathRegions.length}@@`;
      mathRegions.push(`$$${g1}$$`);
      return token;
    });
    s = s.replace(/\$(.*?)\$/g, (_, g1) => {
      const token = `@@MATH${mathRegions.length}@@`;
      mathRegions.push(`$${g1}$`);
      return token;
    });

    // Structural conversions
    s = s.replace(/\\section\*?\{([^}]+)\}/g, "\n## $1\n");
    s = s.replace(/\\subsection\*?\{([^}]+)\}/g, "\n### $1\n");
    s = s.replace(/\\begin\{(.*?)\}|\\end\{(.*?)\}/g, "");

    // Basic formatting
    s = s.replace(/\\textbf\{([^}]+)\}/g, "**$1**");
    s = s.replace(/\\textit\{([^}]+)\}/g, "*$1*");
    s = s.replace(/\\emph\{([^}]+)\}/g, "*$1*");

    // Remove other simple commands \cmd{...} -> ...
    s = s.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1");

    // Remove remaining backslashes that are not in math
    s = s.replace(/\\/g, "");

    // Restore math regions
    s = s.replace(
      /@@MATH(\d+)@@/g,
      (_, idx) => mathRegions[parseInt(idx, 10)] || ""
    );
    return s;
  };

  const processImagesInText = async (
    zip: JSZip,
    text: string,
    statementFolder: string
  ) => {
    if (!text) return text;
    let out = text;

    const mdRe = /!\[[^\]]*\]\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = mdRe.exec(text)) !== null) {
      const imgPath = m[1];
      const norm = (statementFolder ? statementFolder + "/" : "") + imgPath;
      const f =
        zip.file(norm) ||
        zip.file(imgPath) ||
        zip.file(norm.replace(/^\//, ""));
      if (!f) continue;
      const buf = await f.async("arraybuffer");
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++)
        binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      const ext = imgPath.split(".").pop()?.toLowerCase() || "png";
      const mime =
        ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "gif"
          ? "image/gif"
          : "image/png";
      out = out.split(m[0]).join(`![image](data:${mime};base64,${b64})`);
    }

    const imgTagRe = /<img[^>]+src\s*=\s*(["'])(.*?)\1[^>]*>/g;
    while ((m = imgTagRe.exec(text)) !== null) {
      const imgPath = m[2];
      const norm = (statementFolder ? statementFolder + "/" : "") + imgPath;
      const f =
        zip.file(norm) ||
        zip.file(imgPath) ||
        zip.file(norm.replace(/^\//, ""));
      if (!f) continue;
      const buf = await f.async("arraybuffer");
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++)
        binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      const ext = imgPath.split(".").pop()?.toLowerCase() || "png";
      const mime =
        ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "gif"
          ? "image/gif"
          : "image/png";
      out = out.split(m[0]).join(`<img src="data:${mime};base64,${b64}" />`);
    }

    return out;
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setZipName(file.name);
    setMessage(null);
    setProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(data);

      const problemXmlFile = zip.file("problem.xml");
      if (!problemXmlFile) throw new Error("problem.xml not found in package");
      const xmlText = await problemXmlFile.async("string");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");

      const nameEl = xmlDoc.querySelector("name");
      const problemName =
        (nameEl ? nameEl.getAttribute("value") : null) ||
        `imported-${Date.now()}`;

      const testset = xmlDoc.querySelector('testset[name="tests"]');
      if (!testset) throw new Error("testset tests not found");
      const timeLimitMs = parseInt(
        testset.querySelector("time-limit")?.textContent || "1000",
        10
      );
      const memoryBytes = parseInt(
        testset.querySelector("memory-limit")?.textContent || "268435456",
        10
      );
      const timeLimit = Math.max(0.001, timeLimitMs / 1000);
      // memory-limit in Polygon is in bytes; convert to megabytes for our API
      const memoryLimit = Math.max(1, Math.floor(memoryBytes / (1024 * 1024)));

      const interactor = xmlDoc.querySelector("interactor");
      const checker = xmlDoc.querySelector("checker");
      const isInteractive = !!interactor;

      const inputPathPattern =
        testset.querySelector("input-path-pattern")?.textContent || "";
      const answerPathPattern =
        testset.querySelector("answer-path-pattern")?.textContent || "";
      const testEls = Array.from(testset.querySelectorAll("tests > test"));
      if (testEls.length === 0) throw new Error("no testcases found");

      type CaseEntry = {
        index: number;
        inputPath: string;
        answerPath: string;
        inputFileName: string;
        outputFileName: string;
        points: number;
        group: string;
      };
      type BatchEntry = {
        name: string;
        points: number;
        points_policy: string;
        dependencies: Array<string | null>;
        cases: number[];
      };
      const casesData: CaseEntry[] = [];
      const batches: Record<string, BatchEntry> = {};
      const normalCases: number[] = [];

      // collect groups
      const groupsEl = testset.querySelector("groups");
      if (groupsEl) {
        for (const g of Array.from(groupsEl.children || [])) {
          const name = g.getAttribute("name") || "";
          const points = parseFloat(g.getAttribute("points") || "0");
          const pointsPolicy = g.getAttribute("points-policy") || "each-test";
          const depsEl = g.querySelector("dependencies");
          const deps = depsEl
            ? Array.from(depsEl.children || []).map((d) =>
                d.getAttribute("group")
              )
            : [];
          batches[name] = {
            name,
            points,
            points_policy: pointsPolicy,
            dependencies: deps || [],
            cases: [],
          };
        }
      }

      for (let i = 0; i < testEls.length; i++) {
        const test = testEls[i];
        const idx = i + 1;
        const points = parseFloat(test.getAttribute("points") || "0");
        const group = test.getAttribute("group") || "";
        const inputPath = inputPathPattern
          ? inputPathPattern
              .replace(/%0?(\d*)(?:ll|I64)?[di]/i, (_, width) => {
                const w = width ? parseInt(width, 10) : 0;
                return w > 0 ? String(idx).padStart(w, "0") : String(idx);
              })
              .replace("{0}", String(idx))
          : `${idx}`;
        const answerPath = answerPathPattern
          ? answerPathPattern
              .replace(/%0?(\d*)(?:ll|I64)?[di]/i, (_, width) => {
                const w = width ? parseInt(width, 10) : 0;
                return w > 0 ? String(idx).padStart(w, "0") : String(idx);
              })
              .replace("{0}", String(idx))
          : `${idx}`;
        const inputFileName = `${String(idx).padStart(2, "0")}.inp`;
        const outputFileName = `${String(idx).padStart(2, "0")}.out`;
        casesData.push({
          index: i,
          inputPath,
          answerPath,
          inputFileName,
          outputFileName,
          points,
          group,
        });
        if (group && batches[group]) batches[group].cases.push(i);
        else normalCases.push(i);
      }

      // flatten each-test batches
      for (const name of Object.keys(batches)) {
        if (batches[name].points_policy === "each-test") {
          // assign group points to individual tests if they don't have explicit points
          for (const ci of batches[name].cases) {
            if (
              typeof casesData[ci].points !== "number" ||
              casesData[ci].points === 0
            ) {
              casesData[ci].points = batches[name].points;
            }
            normalCases.push(ci);
          }
          delete batches[name];
        }
      }

      // apply ignore flags
      const effectiveBatches = { ...batches };
      let effectiveNormal = [...normalCases];
      if (ignoreZeroPointBatches) {
        for (const bn of Object.keys(effectiveBatches))
          if (effectiveBatches[bn].points === 0) delete effectiveBatches[bn];
      }
      if (ignoreZeroPointCases) {
        effectiveNormal = effectiveNormal.filter(
          (i) => casesData[i].points > 0
        );
      }

      // build tests zip
      const testsFolder = new JSZip();
      const finalCaseIndices: number[] = [];
      for (const idx of effectiveNormal.sort((a, b) => a - b)) {
        const cd = casesData[idx];
        const inpFile =
          zip.file(cd.inputFileName) ||
          zip.file(cd.inputPath) ||
          zip.file(cd.inputPath.replace(/^\//, ""));
        const outFile =
          zip.file(cd.outputFileName) ||
          zip.file(cd.answerPath) ||
          zip.file(cd.answerPath.replace(/^\//, ""));
        if (inpFile && outFile) {
          testsFolder.file(
            cd.inputFileName,
            await inpFile.async("arraybuffer")
          );
          testsFolder.file(
            cd.outputFileName,
            await outFile.async("arraybuffer")
          );
          finalCaseIndices.push(idx);
        }
      }
      for (const batch of Object.values(effectiveBatches)) {
        for (const ci of batch.cases.sort((a: number, b: number) => a - b)) {
          const cd = casesData[ci];
          const inpFile =
            zip.file(cd.inputFileName) ||
            zip.file(cd.inputPath) ||
            zip.file(cd.inputPath.replace(/^\//, ""));
          const outFile =
            zip.file(cd.outputFileName) ||
            zip.file(cd.answerPath) ||
            zip.file(cd.answerPath.replace(/^\//, ""));
          if (inpFile && outFile) {
            testsFolder.file(
              cd.inputFileName,
              await inpFile.async("arraybuffer")
            );
            testsFolder.file(
              cd.outputFileName,
              await outFile.async("arraybuffer")
            );
            finalCaseIndices.push(ci);
          }
        }
      }

      const testsZipBlob = await testsFolder.generateAsync({ type: "blob" });

      // Build detectedCases array compatible with backend finalize()
      const detectedCases: Array<CaseOrBatch> = [];
      // add normal cases first (include per-case points)
      for (const idx of effectiveNormal.sort((a, b) => a - b)) {
        const cd = casesData[idx];
        detectedCases.push({
          input: cd.inputFileName,
          output: cd.outputFileName,
          points: typeof cd.points === "number" ? cd.points : 1,
        });
      }
      // then add batches as start marker, items, and explicit end marker
      for (const batchName of Object.keys(effectiveBatches)) {
        const batch = effectiveBatches[batchName];
        // skip empty batches
        if (!batch || !batch.cases || batch.cases.length === 0) continue;
        detectedCases.push({
          type: "S",
          points: typeof batch.points === "number" ? batch.points : 0,
        });
        for (const ci of batch.cases.sort((a: number, b: number) => a - b)) {
          const cd = casesData[ci];
          detectedCases.push({
            input: cd.inputFileName,
            output: cd.outputFileName,
          });
        }
        detectedCases.push({ type: "E" });
      }

      // checker
      let checkerFile: File | null = null;
      if (!isInteractive && checker) {
        const src = checker.querySelector("source");
        const path = src?.getAttribute("path");
        if (path) {
          const f = zip.file(path);
          if (f) {
            const buf = await f.async("arraybuffer");
            const fileName = path.split("/").pop() || "checker.cpp";
            checkerFile = new File([buf], fileName, { type: "text/x-c++src" });
          }
        }
      }

      // parse statements
      const statementElems = Array.from(
        xmlDoc.querySelectorAll('statement[type="application/x-tex"]')
      ) as Element[];
      let finalDescription = "Imported from Polygon.";
      if (statementElems.length > 0) {
        for (const st of statementElems) {
          const path = st.getAttribute("path") || "";
          const folder = path.replace(/problem\.tex$/, "");
          const propPath = folder
            ? `${folder}problem-properties.json`
            : "problem-properties.json";
          const propFile =
            zip.file(propPath) || zip.file("problem-properties.json");
          if (!propFile) continue;
          try {
            const propsText = await propFile.async("string");
            const props = JSON.parse(propsText);
            let desc = "";
            if (props.legend)
              desc += texToMarkdownFallback(props.legend) + "\n\n";
            desc +=
              "## Input\n\n" +
              (props.input ? texToMarkdownFallback(props.input) : "") +
              "\n\n";
            desc +=
              "## Output\n\n" +
              (props.output ? texToMarkdownFallback(props.output) : "") +
              "\n\n";
            if (props.interaction)
              desc +=
                "## Interaction\n\n" +
                texToMarkdownFallback(props.interaction) +
                "\n\n";
            if (props.scoring)
              desc +=
                "## Scoring\n\n" +
                texToMarkdownFallback(props.scoring) +
                "\n\n";
            if (Array.isArray(props.sampleTests)) {
              for (let i = 0; i < props.sampleTests.length; i++) {
                const s = props.sampleTests[i] || {};
                const sin = (s.input || "").toString().trim();
                const sout = (s.output || "").toString().trim();
                desc +=
                  `## Sample Input ${i + 1}\n\n` + "```\n" + sin + "\n```\n\n";
                desc +=
                  `## Sample Output ${i + 1}\n\n` +
                  "```\n" +
                  sout +
                  "\n```\n\n";
              }
            }
            if (props.notes)
              desc +=
                "## Notes\n\n" + texToMarkdownFallback(props.notes) + "\n\n";
            desc = await processImagesInText(
              zip,
              desc,
              folder.replace(/\/$/, "")
            );
            finalDescription = desc;
            break;
          } catch {
            // ignore
          }
        }
      }

      const parsed: ParsedPackage = {
        problemName,
        timeLimit,
        memoryLimit,
        isInteractive,
        testsZipBlob,
        detectedCases,
        checkerFile,
        finalDescription,
        batches: Object.keys(effectiveBatches).map((bn) => ({
          name: bn,
          points: effectiveBatches[bn].points,
          cases: effectiveBatches[bn].cases.map(
            (ci: number) => casesData[ci].inputFileName
          ),
        })),
        rawCases: finalCaseIndices.map((i) => ({
          inputFile: casesData[i].inputFileName,
          outputFile: casesData[i].outputFileName,
          points: casesData[i].points,
          group: casesData[i].group,
        })),
      };
      setParsedPackage(parsed);
      setMessage(
        "Package parsed. Click Upload to upload tests/checker, then Import to create problem and finalize."
      );
      return parsed;
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!parsedPackage) return;
    setProcessing(true);
    setMessage(null);
    try {
      const form = new FormData();
      if (slugError || !slug) throw new Error("Please enter a valid slug");
      form.append(
        "file",
        new File([parsedPackage.testsZipBlob], "upload.zip", {
          type: "application/zip",
        })
      );
      form.append("path", `tests/${slug}/archive.zip`);
      const uploadRes = await fetch("/api/upload-testcase-file", {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload tests archive");
      const uploadJson = await uploadRes.json();
      setUploadedArchive(uploadJson);

      if (parsedPackage.checkerFile) {
        const cform = new FormData();
        cform.append("file", parsedPackage.checkerFile);
        cform.append("path", `tests/${slug}/${parsedPackage.checkerFile.name}`);
        const cres = await fetch("/api/upload-checker", {
          method: "POST",
          body: cform,
        });
        if (!cres.ok) throw new Error("Failed to upload checker");
        const cj = await cres.json();
        setUploadedChecker(cj);
      }

      setMessage(
        "Upload finished. Click Import to create problem and finalize testcases."
      );
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!parsedPackage || !uploadedArchive) {
      setMessage("Please parse and upload package first.");
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {
        slug: slug,
        name: parsedPackage.problemName,
        points: 0.01,
        description: parsedPackage.finalDescription,
        pdf: null,
        categoryId: undefined,
        types: [],
        allowedLanguages: [],
        timeLimit: parsedPackage.timeLimit,
        memoryLimit: parsedPackage.memoryLimit,
        short_circuit: false,
        archives: uploadedArchive?.key ? [uploadedArchive.key as string] : [],
      };
      // prepare finalize payload and headers
      const finalizePayload = {
        cases: parsedPackage.detectedCases,
        checker: uploadedChecker
          ? {
              url: uploadedChecker.url,
              key: uploadedChecker.key,
              name: parsedPackage.isInteractive ? "interacttl" : "bridged",
            }
          : null,
        archiveUrl: uploadedArchive?.url,
      };

      // ensure totalPoints > 0 per backend expectation; if not, try to adjust payload
      const isMarker = (c: CaseOrBatch): boolean =>
        "type" in (c as unknown as Record<string, unknown>);
      const isBatchStart = (c: CaseOrBatch): c is BatchStart => {
        if (!isMarker(c)) return false;
        const t = (c as Record<string, unknown>)["type"];
        return typeof t === "string" && t === "S";
      };
      const isCase = (c: CaseOrBatch): c is CaseObj => !isMarker(c);

      const adjustCasesForBackend = (casesArr: Array<CaseOrBatch>) => {
        let total = 0;
        let hasBatch = false;
        for (const c of casesArr) {
          if (isBatchStart(c)) {
            hasBatch = true;
            total += c.points || 0;
          } else if (isCase(c) && c.points != null) {
            total += c.points || 0;
          }
        }

        if (total > 0) return casesArr;

        if (hasBatch) {
          return casesArr.map((c) => {
            if (isMarker(c)) return c;
            const caseObj = c as {
              input: string;
              output: string;
              points?: number;
            };
            const copy: { input: string; output: string } = {
              input: caseObj.input,
              output: caseObj.output,
            };
            return copy as CaseOrBatch;
          });
        }

        return casesArr.map((c) => {
          if (isMarker(c)) return c;
          const caseObj = c as {
            input: string;
            output: string;
            points?: number;
          };
          const copy: { input: string; output: string; points: number } = {
            input: caseObj.input,
            output: caseObj.output,
            points:
              typeof caseObj.points === "number" && caseObj.points > 0
                ? caseObj.points
                : 1,
          };
          return copy as CaseOrBatch;
        });
      };

      const adjustedCases = adjustCasesForBackend(
        finalizePayload.cases as Array<CaseOrBatch>
      );
      finalizePayload.cases = adjustedCases;

      const headers = {
        "Content-Type": "application/json",
        Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
      };

      // proceed with create + finalize

      // perform create + finalize
      const createRes = await fetch("/api/problems/create/", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        const text = await createRes.text();
        throw new Error(`Create problem failed: ${createRes.status} ${text}`);
      }
      const j = await createRes.json();

      const finRes = await fetch(
        `/api/problem/${encodeURIComponent(j.slug)}/finalize-testcase-upload`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(finalizePayload),
        }
      );
      if (!finRes.ok) {
        const text = await finRes.text();
        throw new Error(`Finalize failed: ${finRes.status} ${text}`);
      }

      setMessage("Problem imported and testcases finalized. Redirecting...");
      window.location.href = `/problem/${j.slug}`;
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessing(false);
    }
  };

  // debug confirm removed

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">
        Import Codeforces Polygon package
      </h1>
      <p className="mb-4">
        Upload a Polygon ZIP exported package and we will import tests and
        statement metadata. Checker will default to Testlib.
      </p>
      <div className="space-y-4">
        <div>
          <Label>Problem slug</Label>
          <Input
            value={slug}
            onChange={(e) => {
              const v = e.target.value;
              setSlug(v);
              // validate: allow letters, digits, underscore, hyphen
              if (!v || v.length === 0) {
                setSlugError("Slug is required");
              } else if (v.length > 64) {
                setSlugError("Slug too long (max 64 chars)");
              } else if (!/^[A-Za-z0-9_-]+$/.test(v)) {
                setSlugError(
                  "Invalid characters: only letters, digits, underscore and hyphen allowed"
                );
              } else {
                setSlugError(null);
              }
            }}
          />
          {slugError && (
            <div className="text-xs text-red-600 mt-1">{slugError}</div>
          )}
        </div>

        <div>
          <Label>Package</Label>
          <div className="flex items-center gap-2">
            <input
              id="polygon-upload"
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById("polygon-upload")?.click()}
            >
              Choose file
            </Button>
            <div className="text-sm text-muted-foreground">
              {zipName || "No file selected"}
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Make sure to use package: <strong>linux</strong>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={ignoreZeroPointBatches}
              onChange={(e) => setIgnoreZeroPointBatches(e.target.checked)}
            />
            <span className="text-sm ml-1">Ignore zero-point batches</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={ignoreZeroPointCases}
              onChange={(e) => setIgnoreZeroPointCases(e.target.checked)}
            />
            <span className="text-sm ml-1">Ignore zero-point cases</span>
          </label>
        </div>

        {processing && <div>Processing...</div>}
      </div>
      {zipName && <div className="mt-2">Selected: {zipName}</div>}
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => handleUpload()}
          disabled={!parsedPackage || processing}
        >
          Upload
        </Button>
        <Button
          onClick={() => handleImport()}
          disabled={!parsedPackage || !uploadedArchive || processing}
        >
          Import
        </Button>
      </div>
      {message && <div className="mt-4 text-red-600">{message}</div>}
    </main>
  );
}
