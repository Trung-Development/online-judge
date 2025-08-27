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

export default function ManageProblemPage() {
  const params = useParams() as Record<string, string | undefined>;
  const slugParam = params.slug ?? "";
  const router = useRouter();

  const { user, sessionToken } = useAuth();

  const canEdit = hasPermission(
    user?.perms,
    FEUserPermissions.EDIT_PROBLEM_TESTS
  );

  const [loading, setLoading] = useState(false);
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
      setLoading(true);
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

        const probRes = await fetch(
          `/api/problem/${encodeURIComponent(slugParam)}`
        );
        if (!probRes.ok) {
          setError("Failed to load problem");
          setLoading(false);
          return;
        }
        const prob = await probRes.json();
        setName(prob.name || "");
        setDescription(prob.description || "");
        // PDF UUID provided by backend (if any)
        if (prob.pdfUuid) {
          setPdfUuidState(prob.pdfUuid);
          // derive filename for display
          setPdfFileName(`${prob.pdfUuid}.pdf`);
        }
        setTimeLimit(typeof prob.timeLimit === "number" ? prob.timeLimit : 1);
        setMemoryLimit(
          typeof prob.memoryLimit === "number" ? prob.memoryLimit : 256
        );
        setCategoryId(prob.categoryId ?? undefined);
        setAllowedLanguages(prob.allowedLanguages || []);
        // types are names on read; if API returns ids, adapt; try to map by name
        if (prob.type && Array.isArray(prob.type)) {
          const sel = (typesRes as { id: number; name: string }[])
            .filter((t) => prob.type.includes(t.name))
            .map((t) => t.id);
          setSelectedTypes(sel);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
    // OverType init moved to separate effect below so it can use the fetched description
    return () => {
      // nothing to cleanup here; OverType init/cleanup handled in its own effect below
    };
  }, [slugParam]);

  // Initialize OverType once when description is available. We capture the instance
  // locally so cleanup uses the same reference the effect created.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof window === "undefined") return;
      try {
        const OverType = (await import("overtype")).default;
        // force 'cave' theme for demo dark appearance
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
        } catch {}

        // don't init if already initialized
        if (!mounted || overTypeRef.current) return;

        const instRaw = new OverType("#overtype-editor-manage", {
          toolbar: true,
          showStats: true,
          value: description || "",
          textareaProps: { name: "description" },
          theme: preferredTheme,
        });
        // OverType may return [instance] or the instance itself
        if (Array.isArray(instRaw) && (instRaw as unknown[]).length > 0) {
          overTypeRef.current = (
            instRaw as unknown[]
          )[0] as import("overtype").default;
        } else {
          overTypeRef.current = instRaw as import("overtype").default;
        }

        const onStorage = (e: StorageEvent) => {
          if (e.key === "theme") {
            const cur = overTypeRef.current as {
              showPreviewMode?: (v: boolean) => void;
            } | null;
            if (cur && typeof cur.showPreviewMode === "function") {
              try {
                cur.showPreviewMode(false);
              } catch {}
            }
          }
        };
        window.addEventListener("storage", onStorage);
        window.addEventListener("beforeunload", () =>
          window.removeEventListener("storage", onStorage)
        );
      } catch {}
    })();
    return () => {
      mounted = false;
      const cur = overTypeRef.current as { destroy?: () => void } | null;
      if (cur && typeof cur.destroy === "function") {
        try {
          cur.destroy();
        } catch {}
      }
      overTypeRef.current = null;
    };
    // run once when description is set (or initially empty for create flow)
  }, [description]);

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    // read editor content if present
    let payloadDescription = description;
    try {
      const cur = overTypeRef.current as { getValue?: () => string } | null;
      if (cur && typeof cur.getValue === "function") {
        payloadDescription = cur.getValue();
      }
    } catch {}
    // client-side validation
    if (!(timeLimit > 0) || timeLimit > 60) {
      setError("Time limit must be > 0 and ≤ 60 seconds");
      setLoading(false);
      return;
    }
    if (!(memoryLimit > 0)) {
      setError("Memory limit must be > 0 MB");
      setLoading(false);
      return;
    }

    try {
      const bodyPayload = JSON.stringify({
        slug,
        name,
        description: payloadDescription,
        pdfUuid: pdfUuidState,
        categoryId,
        types: selectedTypes,
        allowedLanguages,
        timeLimit,
        memoryLimit,
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
        const text = await res.text().catch(() => "");
        const j = (() => {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        })();
        throw new Error(j?.message || `Failed to save: ${res.status}`);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this problem? This cannot be undone.")) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/problem/${encodeURIComponent(slugParam)}`, {
        method: "DELETE",
        headers: {
          Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
        },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || `Failed to delete: ${res.status}`);
      }
      // Navigate away after delete
      router.push("/problems");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-yellow-600">
          You do not have permission to edit this problem.
        </div>
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
                  if (j.pdfUuid) {
                    setPdfUuidState(j.pdfUuid);
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

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </main>
  );
}
