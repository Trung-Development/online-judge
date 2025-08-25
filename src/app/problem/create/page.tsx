"use client";

import React, { useState, useEffect } from "react";
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

export default function CreateProblemPage() {
  const { sessionToken } = useAuth();
  const router = useRouter();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [points, setPoints] = useState(100);
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number>(1);
  const [memoryLimit, setMemoryLimit] = useState<number>(256);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [typesOptions, setTypesOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/problem/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
        },
        body: JSON.stringify({
          slug,
          name,
          points,
          description,
          categoryId,
          types: selectedTypes,
          allowedLanguages: allowedLanguages,
          timeLimit,
          memoryLimit,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.message || `Failed: ${res.status}`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      // Navigate to manage page of new problem
      router.push(`/problem/${json.slug}/manage`);
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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border p-2"
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
            hideSelectAll
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
    </main>
  );
}
