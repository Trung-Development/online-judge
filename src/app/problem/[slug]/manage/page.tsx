"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { hasPermission, UserPermissions as FEUserPermissions } from "@/lib/permissions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { languages } from "@/constants";

export default function ManageProblemPage() {
  const params = useParams() as Record<string, string | undefined>;
  const slugParam = params.slug ?? "";
  const router = useRouter();

  const { user, sessionToken } = useAuth();

  const canEdit = hasPermission(user?.perms, FEUserPermissions.EDIT_PROBLEM_TESTS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [slug, setSlug] = useState(slugParam);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>([]);
  const [typesOptions, setTypesOptions] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [catsRes, typesRes] = await Promise.all([
          fetch('/api/categories/all').then((r) => r.json()).catch(() => [] as { id: number; name: string }[]),
          fetch('/api/types/all').then((r) => r.json()).catch(() => [] as { id: number; name: string }[]),
        ]);
        setCategories(catsRes);
        setTypesOptions(typesRes);

        const probRes = await fetch(`/api/problem/${encodeURIComponent(slugParam)}`);
        if (!probRes.ok) {
          setError('Failed to load problem');
          setLoading(false);
          return;
        }
        const prob = await probRes.json();
        setName(prob.name || '');
        setDescription(prob.description || '');
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
  }, [slugParam]);

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/problem/${encodeURIComponent(slugParam)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: sessionToken ? `Bearer ${sessionToken}` : '',
        },
        body: JSON.stringify({
          slug,
          name,
          description,
          categoryId,
          types: selectedTypes,
          allowedLanguages,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
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
    if (!confirm('Delete this problem? This cannot be undone.')) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/problem/${encodeURIComponent(slugParam)}`, {
        method: 'DELETE',
        headers: {
          Authorization: sessionToken ? `Bearer ${sessionToken}` : '',
        },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || `Failed to delete: ${res.status}`);
      }
      // Navigate away after delete
      router.push('/problems');
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
        <div className="text-yellow-600">You do not have permission to edit this problem.</div>
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
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <Select onValueChange={(v) => setCategoryId(v ? parseInt(v) : undefined)} value={categoryId !== undefined ? String(categoryId) : undefined}>
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Types</label>
          <MultiSelect
            id="types"
            placeholder="Select types"
            options={typesOptions.map((t) => ({ value: String(t.id), label: t.name }))}
            onValueChange={(vals) => setSelectedTypes(vals.map((v) => parseInt(v)))}
            defaultValue={selectedTypes.map((v) => String(v))}
            hideSelectAll
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Allowed languages</label>
          <MultiSelect
            id="allowedLanguages"
            placeholder="Select allowed languages"
            options={languages.map((l) => ({ value: l.value, label: l.label }))}
            onValueChange={setAllowedLanguages}
            defaultValue={allowedLanguages}
            hideSelectAll
          />
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</Button>
        </div>
      </div>
    </main>
  );
}
