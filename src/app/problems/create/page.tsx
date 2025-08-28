"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { languages } from "@/constants";
import { getCategories } from "@/lib/server-actions/categories";
import { getTypes } from "@/lib/server-actions/types";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { hasPermission, UserPermissions } from "@/lib/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

export default function CreateProblemPage() {
  const { sessionToken } = useAuth();
  const router = useRouter();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [points, setPoints] = useState(100);
  const [description] = useState("");
  const overTypeRef = useRef<import("overtype").default | null>(null);
  // Initialize OverType editor on the client only
  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      try {
        const OverType = (await import("overtype")).default;
        // force 'cave' theme for demo dark appearance
        const preferredTheme = "cave";

        // provide a sensible dark palette override when using the dark theme
        const otThemeOverrides = {
          bgPrimary: "#0a0a0a",
          bgSecondary: "#0f1115",
          textPrimary: "#e6eef8",
          accent: "#6ea8fe",
          border: "#222228",
        } as Record<string, string>;

        // Try to set module-level theme before instantiating the editor so styles are applied early
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

        const inst: unknown = new OverType("#overtype-editor-create", {
          toolbar: true,
          showStats: true,
          value: description,
          textareaProps: { name: "description" },
          theme: preferredTheme,
        });
        // OverType may return [instance] or the instance itself depending on build
        if (Array.isArray(inst) && (inst as unknown[]).length > 0) {
          overTypeRef.current = (
            inst as unknown[]
          )[0] as import("overtype").default;
        } else {
          overTypeRef.current = inst as import("overtype").default;
        }
        // Ensure theme is applied at runtime by calling instance API if available
        try {
          const opts = {
            bgPrimary: "#0a0a0a",
            bgSecondary: "#111",
            textPrimary: "#fff",
            accent: "#4251de",
            border: "#333",
          } as Record<string, string>;
          const instSafe = inst as {
            setTheme?: (s: string, o?: Record<string, string>) => void;
          } | null;
          if (instSafe && typeof instSafe.setTheme === "function") {
            instSafe.setTheme!("solar", opts);
          } else {
            // fallback to module-level API if present
            const OTGlobal = (await import("overtype")).default as unknown as {
              setTheme?: (s: string, o?: Record<string, string>) => void;
            };
            if (OTGlobal && typeof OTGlobal.setTheme === "function") {
              OTGlobal.setTheme!("solar", opts);
            }
          }
        } catch { }

        // listen to storage changes for theme toggle in other tabs
        const onStorage = (e: StorageEvent) => {
          if (e.key === "theme") {
            const cur = overTypeRef.current as {
              showPreviewMode?: (v: boolean) => void;
            } | null;
            if (cur && typeof cur.showPreviewMode === "function") {
              try {
                // no-op placeholder: some OverType builds may expose dynamic theme setter
                // leaving here to avoid hard reloads; if not supported, reload will be required
                cur.showPreviewMode(false);
              } catch { }
            }
          }
        };
        window.addEventListener("storage", onStorage);
        // remove listener on unload
        window.addEventListener("beforeunload", () =>
          window.removeEventListener("storage", onStorage),
        );
      } catch {
        // ignore if lib not present
      }
    })();
    return () => {
      const cur = overTypeRef.current as { destroy?: () => void } | null;
      if (cur && typeof cur.destroy === "function") {
        try {
          cur.destroy();
        } catch { }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for editor init
  }, []);
  const [timeLimit, setTimeLimit] = useState<number>(1);
  const [memoryLimit, setMemoryLimit] = useState<number>(256);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>([]);
  const [short_circuit, setShortCircuit] = useState<boolean>(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [typesOptions, setTypesOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUuid, setPdfUuid] = useState<string | null>(null);
  const user = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // If OverType editor is present, use its value for the request directly
    let payloadDescription = description;
    try {
      const cur = overTypeRef.current as { getValue?: () => string } | null;
      if (cur && typeof cur.getValue === "function") {
        payloadDescription = cur.getValue();
      }
    } catch { }
    try {
      const res = await fetch("/api/problems/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
        },
        body: JSON.stringify({
          slug,
          name,
          points,
          description: payloadDescription,
          pdfUuid,
          categoryId,
          types: selectedTypes,
          allowedLanguages: allowedLanguages,
          timeLimit,
          memoryLimit,
          short_circuit: short_circuit
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message || `Failed: ${res.status}`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      // Navigate to view page of new problem
      router.push(`/problem/${json.slug}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as Error).message
          : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
        const t = await getTypes();
        setTypesOptions(t);
      } catch {
        // ignore
      }
    })();
  }, []);

  if (!user.user || !hasPermission(user.user.perms, UserPermissions.CREATE_NEW_PROBLEM)) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive" className="mb-6">
          <FontAwesomeIcon icon={faExclamationCircle} className="h-4 w-4" />
          <AlertDescription>You are not allowed to create new problems. Please check your permissions or contact an administrator.</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Create problem</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium mb-1">Points</label>
          <Input
            type="number"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value || "0"))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          {/* OverType editor will attach to this element in the client */}
          <div
            id="overtype-editor-create"
            className="w-full min-h-[24rem] h-96"
          />
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

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              PDF Statement (optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="application/pdf"
                id="pdf-statement-upload"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPdfFileName(f.name);
                  setPdfUploading(true);
                  try {
                    const form = new FormData();
                    form.append("file", f);
                    // When creating a new problem, slug may not exist yet; upload to temp
                    form.append("slug", slug || "temp");
                    const res = await fetch("/api/pdf-upload", {
                      method: "POST",
                      body: form,
                    });
                    if (!res.ok) throw new Error("Upload failed");
                    const j = await res.json();
                    if (j.pdfUuid) setPdfUuid(j.pdfUuid);
                  } catch (err) {
                    console.error("PDF upload error", err);
                  } finally {
                    setPdfUploading(false);
                  }
                }}
              />
              <Button
                onClick={() => document.getElementById("pdf-statement-upload")?.click()}
                className="inline-flex items-center px-3 py-2"
              >
                {pdfUploading ? "Uploading..." : pdfFileName || "Choose PDF"}
              </Button>
              {pdfUuid && (
                <div className="text-sm text-muted-foreground">Uploaded</div>
              )}
            </div>
          </div>
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
            Maximum 60s. Use decimal values for fractions (e.g. 0.5).
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
            Value in MB (1024 MB = 1 GB). Decimal values allowed.
          </p>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </main >
  );
}
