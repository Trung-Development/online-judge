"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  hasPermission,
  UserPermissions as FEUserPermissions,
} from "@/lib/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { languages } from "@/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faExclamationTriangle, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { IProblemPageData } from "@/types";

export default function ManageProblemPage({ problem }: {
  problem: IProblemPageData & {
    pdf?: string | null;
    categoryId?: number | null
  }
}) {
  const params = useParams() as Record<string, string | undefined>;
  const slugParam = params.slug ?? "";
  const router = useRouter();

  const { user, sessionToken } = useAuth();

  const canEdit = hasPermission(
    user?.perms,
    FEUserPermissions.EDIT_PROBLEM_TESTS
  );

  const [loading, setLoading] = useState("");
  const [error, setError] = useState<string | null>(null);

  // form state
  const [slug, setSlug] = useState(slugParam);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUuidState, setPdfUuidState] = useState<string | null>(null);
  const overTypeRef = useRef<import("overtype").default | null>(null);
  const [timeLimit, setTimeLimit] = useState<number>(1);
  const [short_circuit, setShortCircuit] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const [memoryLimit, setMemoryLimit] = useState<number>(256);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>([]);
  const [typesOptions, setTypesOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      setLoading("");
      try {
        const [catsRes, typesRes] = await Promise.all([
          fetch("/api/categories/all")
            .then((r) => r.json())
            .catch(() => [] as { id: number; name: string }[]),
          fetch("/api/types/all")
            .then((r) => r.json())
            .catch(() => [] as { id: number; name: string }[]),
        ]);
        setCategories(catsRes);
        setTypesOptions(typesRes);
        setName(problem.name || "");
        setDescription(problem.description || "");
        // PDF UUID provided by backend (if any)
        if (problem.pdf) {
          setPdfUuidState(problem.pdf || "");
          // derive filename for display
          setPdfFileName(`${problem.pdf || ""}.pdf`);
        }
        setTimeLimit(typeof problem.timeLimit === "number" ? problem.timeLimit : 1);
        setMemoryLimit(
          typeof problem.memoryLimit === "number" ? problem.memoryLimit : 256
        );
        setShortCircuit(!!(problem.short_circuit || false));
        setCategoryId(problem.categoryId ?? undefined);
        setAllowedLanguages(problem.allowedLanguages || []);
        // types are names on read; if API returns ids, adapt; try to map by name
        if (problem.type && Array.isArray(problem.type)) {
          const sel = (typesRes as { id: number; name: string }[])
            .filter((t) => problem.type.includes(t.name))
            .map((t) => t.id);
          setSelectedTypes(sel);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setLoading("");
      }
    })();
    // OverType init moved to separate effect below so it can use the fetched description
    return () => {
      // nothing to cleanup here; OverType init/cleanup handled in its own effect below
    };
  }, [problem.allowedLanguages, problem.categoryId, problem.description, problem.memoryLimit, problem.name, problem.pdf, problem.short_circuit, problem.timeLimit, problem.type, slugParam]);

  // Initialize OverType once when description (or slugParam) is available.
  // Use a container ref and a small retry loop to handle client navigations
  // where the DOM node might not be immediately attached.
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (typeof window === "undefined") return;
      if (overTypeRef.current) return; // already initialized

      try {
        const OverType = (await import("overtype")).default;
        const preferredTheme = "cave";
        const otThemeOverrides = {
          bgPrimary: "#0a0a0a",
          bgSecondary: "#0f1115",
          textPrimary: "#e6eef8",
          accent: "#6ea8fe",
          border: "#222228",
        } as Record<string, string>;

        try {
          const OTModule = await import("overtype");
          const OTGlobal = ((OTModule as { default?: unknown }).default ||
            OTModule) as unknown as {
              setTheme?: (s: string, o?: Record<string, string>) => void;
            };
          if (OTGlobal && typeof OTGlobal.setTheme === "function") {
            OTGlobal.setTheme(preferredTheme, otThemeOverrides);
          }
        } catch { }

        // retry a few times if the container isn't present yet
        const maxAttempts = 5;
        let attempt = 0;
        while (
          mounted &&
          attempt < maxAttempts &&
          !editorContainerRef.current
        ) {
          // small delay between attempts
          // first attempt is immediate (0ms) to cover most cases
          await new Promise((r) => setTimeout(r, attempt === 0 ? 0 : 50));
          attempt += 1;
        }
        if (!mounted || !editorContainerRef.current) return;

        const selectorOrEl = editorContainerRef.current as HTMLElement;
        const instRaw = new OverType(selectorOrEl, {
          toolbar: true,
          showStats: true,
          value: description || "",
          textareaProps: { name: "description" },
          theme: preferredTheme,
        });
        if (Array.isArray(instRaw) && (instRaw as unknown[]).length > 0) {
          overTypeRef.current = (instRaw as unknown[])[0] as
            | import("overtype").default
            | null;
        } else {
          overTypeRef.current = instRaw as import("overtype").default | null;
        }

        const onStorage = (e: StorageEvent) => {
          if (e.key === "theme") {
            const cur = overTypeRef.current as {
              showPreviewMode?: (v: boolean) => void;
            } | null;
            if (cur && typeof cur.showPreviewMode === "function") {
              try {
                cur.showPreviewMode(false);
              } catch { }
            }
          }
        };
        window.addEventListener("storage", onStorage);
        window.addEventListener("beforeunload", () =>
          window.removeEventListener("storage", onStorage)
        );
      } catch {
        // keep quiet — initialization isn't critical and failures may be transient
        // console.debug("OverType init failed", err);
      }
    };

    init();

    return () => {
      mounted = false;
      const cur = overTypeRef.current as { destroy?: () => void } | null;
      if (cur && typeof cur.destroy === "function") {
        try {
          cur.destroy();
        } catch { }
      }
      overTypeRef.current = null;
    };
    // include description & slugParam so editor re-inits when switching problems
  }, [description, slugParam]);

  const handleSave = async () => {
    setError(null);
    setUpdateSuccess(false);
    setLoading("save");
    // read editor content if present
    let payloadDescription = description;
    try {
      const cur = overTypeRef.current as { getValue?: () => string } | null;
      if (cur && typeof cur.getValue === "function") {
        payloadDescription = cur.getValue();
      }
    } catch { }
    // client-side validation
    if (!(timeLimit > 0) || timeLimit > 60) {
      setError("Time limit must be > 0 and ≤ 60 seconds");
      setLoading("");
      return;
    }
    if (!(memoryLimit > 0)) {
      setError("Memory limit must be > 0 MB");
      setLoading("");
      return;
    }

    try {
      const bodyPayload = JSON.stringify({
        slug,
        name,
        description: payloadDescription,
        pdf: pdfUuidState,
        categoryId,
        types: selectedTypes,
        allowedLanguages,
        timeLimit,
        memoryLimit,
        short_circuit
      });
      const res = await fetch(`/api/problem/${encodeURIComponent(slugParam)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
        },
        body: bodyPayload,
      });
      if (!res.ok) {
        res.json().then(v => {
          console.log(v);
          if (v?.error) setError(v?.error);
          else if (v.message) {
            if (v.message === "INSUFFICIENT_PERMISSIONS")
              setError(
                "You are not authorized to perform this operation. Please try again later.",
              );
            if (v.message === "PROBLEM_NOT_FOUND")
              setError(
                "The problem you are trying to access does not exist. Please check the URL and try again.",
              );
            if (v.message === "PROBLEM_LOCKED")
              setError(
                "Modifications to this problem are restricted. Please contact an administrator for further assistance.",
              );
          } else {
            setError(`Failed to save the new details: ${res.status}. More details are available in the console.`);
          }
        }).catch((x) => {
          setError(`Failed to save the new details: ${res.status}. More details are available in the console`);
          console.log(x);
        })
        setLoading("");
        return;
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading("");
    }
    setUpdateSuccess(true);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this problem? This cannot be undone.")) return;
    setError(null);
    setUpdateSuccess(false);
    setLoading("delete");
    try {
      const res = await fetch(`/api/problem/${encodeURIComponent(slugParam)}`, {
        method: "DELETE",
        headers: {
          Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
        },
      });
      if (!res.ok) {
        res.json().then(v => {
          console.log(v);
          if (v?.error) setError(v?.error);
          else if (v.message) {
            if (v.message === "INSUFFICIENT_PERMISSIONS")
              setError(
                "You are not authorized to perform this operation. Please try again later.",
              );
            if (v.message === "PROBLEM_NOT_FOUND")
              setError(
                "The problem you are trying to access does not exist. Please check the URL and try again.",
              );
            if (v.message === "PROBLEM_LOCKED")
              setError(
                "Modifications to this problem are restricted. Please contact an administrator for further assistance.",
              );
          } else {
            setError(`Failed to load the problem: ${res.status}. More details are available in the console.`);
          }
        }).catch((x) => {
          setError(`Failed to load the problem: ${res.status}. More details are available in the console`);
          console.log(x);
        })
        return;
      }
      // Navigate away after delete
      router.push("/problems");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading("");
    }
  };

  if (!canEdit) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4">
        <Alert variant="warning" className="mb-6">
          <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
          <AlertDescription>
            You do not have the permission to manage problems.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage: {slugParam}</h1>
        <div>
          <Link href={`/problem/${slugParam}`}>
            <Button variant="outline">View problem</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            The problem slug becomes the problem page path — for example, slug{" "}
            <code>abc</code> will be available at <code>/problem/abc</code>.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <div
            id="overtype-editor-manage"
            ref={editorContainerRef}
            className="w-full min-h-[24rem] h-96"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            PDF Statement (optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="application/pdf"
              id="pdf-statement-upload-manage"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setPdfFileName(f.name);
                setPdfUploading(true);
                try {
                  const form = new FormData();
                  form.append("file", f);
                  // use the actual slug for manage uploads
                  form.append("slug", slugParam || slug);
                  const res = await fetch("/api/pdf-upload", {
                    method: "POST",
                    body: form,
                  });
                  if (!res.ok) throw new Error("Upload failed");
                  const j = await res.json();
                  if (j.pdf) {
                    setPdfUuidState(j.pdf);
                    setPdfFileName(f.name);
                  }
                } catch (err) {
                  console.error("PDF upload error", err);
                } finally {
                  setPdfUploading(false);
                }
              }}
            />
            <label
              htmlFor="pdf-statement-upload-manage"
              className="inline-flex items-center px-3 py-2 border rounded cursor-pointer bg-primary text-primary-foreground"
            >
              {pdfUploading
                ? "Uploading..."
                : pdfFileName || (pdfUuidState ? "Uploaded" : "Choose PDF")}
            </label>
            {pdfUuidState && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  // Clear attachment client-side; backend will be updated on save
                  setPdfUuidState(null);
                  setPdfFileName(null);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <Select
            onValueChange={(v) => setCategoryId(v ? parseInt(v) : undefined)}
            value={categoryId !== undefined ? String(categoryId) : undefined}
          >
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex grid-cols-2">
          <label className="block text-sm font-medium mr-3">Short-circuit</label>
          <button
            onClick={() => setShortCircuit(!short_circuit)}
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${short_circuit ? "bg-primary" : "bg-muted"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${short_circuit ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Types</label>
          <MultiSelect
            id="types"
            placeholder="Select types"
            options={typesOptions.map((t) => ({
              value: String(t.id),
              label: t.name,
            }))}
            onValueChange={(vals) =>
              setSelectedTypes(vals.map((v) => parseInt(v)))
            }
            defaultValue={selectedTypes.map((v) => String(v))}
            hideSelectAll
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Allowed languages
          </label>
          <MultiSelect
            id="allowedLanguages"
            placeholder="Select allowed languages"
            options={languages.map((l) => ({ value: l.value, label: l.label }))}
            onValueChange={setAllowedLanguages}
            defaultValue={allowedLanguages}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Time limit (seconds)
          </label>
          <Input
            type="number"
            step="0.01"
            value={String(timeLimit)}
            onChange={(e) => setTimeLimit(parseFloat(e.target.value || "0"))}
          />
          <p className="text-xs text-muted-foreground">
            Maximum 60s. Decimal values allowed (e.g. 0.5).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Memory limit (MB)
          </label>
          <Input
            type="number"
            step="0.1"
            value={String(memoryLimit)}
            onChange={(e) => setMemoryLimit(parseFloat(e.target.value || "0"))}
          />
          <p className="text-xs text-muted-foreground">
            Value in MB. 1024 MB = 1 GB. Decimal values allowed.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        {updateSuccess && (
          <Alert variant="success" className="mb-6">
            <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
            <AlertDescription>
              Problem updated successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading == 'save'}>
            {loading == 'save' ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading == 'delete'}
          >
            {loading == 'delete' ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </main>
  );
}
