"use client";

import { useParams } from "next/navigation";

export default function NotFound() {
  const { slug } = useParams();
  
  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">No such problem</h1>
      <hr className="border-gray-300 mb-4" />
      <p className="text-gray-600">
        Could not find a problem with the code{" "}
        <span className="font-mono">{slug}</span>
      </p>
    </main>
  );
}
