"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkHeadingSeparator from "@/lib/remarkHeadingSeparator";
import "katex/dist/katex.min.css";

import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faClone, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import Loading from "@/app/loading";

import { IProblemData } from "@/types";

export default function ProblemPage() {
  const slug = useParams().slug;
  const [problem, setProblem] = useState<IProblemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(new URL(`/client/problems/${slug}`, process.env.NEXT_PUBLIC_API_ENDPOINT!).toString())
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (res.status === 404 || !ct.includes("application/json")) {
          // If 404 or not JSON, treat as not found
          throw new Error("NOT_FOUND");
        }
        return res.json();
      })
      .then((data) => {
        setProblem(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message === "NOT_FOUND") {
          setProblem(null);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <Loading />;
  if (!problem)
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

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      {/* Title & PDF */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">{problem.name}</h1>
        <Link
          href={`/api/problem/${slug}/pdf`}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <FontAwesomeIcon icon={faFilePdf} />
          View as PDF
        </Link>
      </div>
      <hr className="border-gray-300 mb-6" />

      {/* Buttons */}
      <div className="flex gap-2 mb-6">
        <Button asChild>
          <Link href={`/problem/${slug}/submit`}>Submit</Link>
        </Button>
        {problem.solution && (
          <Button variant="outline" asChild>
            <Link href={`/problem/${slug}/solution`}>Solution</Link>
          </Button>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-card border p-4 mb-6 rounded-md text-sm text-card-foreground">
        <div className="flex justify-between">
          <div>
            <strong>Time:</strong> {problem.timeLimit}s
          </div>
          <div>
            <strong>Memory:</strong> {problem.memoryLimit} MB
          </div>
        </div>
        <div className="mt-2">
          <div>
            <strong>Input:</strong> {problem.input}
          </div>
          <div>
            <strong>Output:</strong> {problem.output}
          </div>
        </div>
        <div className="mt-2">
          <div>
            <strong>Author:</strong> {problem.author.join(", ")}
          </div>
          <div>
            <strong>Type:</strong> {problem.type.join(", ")}
          </div>
        </div>
      </div>

      {/* PDF Viewer (if available) */}
      {problem.pdf && (
        <div className="w-full h-screen mb-6">
          <iframe
            src={`/pdf/${problem.pdf}`}
            className="w-full h-full border rounded-md"
            title={`${problem.name} PDF Statement`}
          />
        </div>
      )}

      {/* Statement + SampleIO and separators */}
      <div className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath, remarkHeadingSeparator]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
              <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
            ),
            h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
              <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />
            ),
            h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
              <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
            ),
            u: (props: React.HTMLAttributes<HTMLElement>) => (
              <u className="underline" {...props} />
            ),
            code: (
              props: React.HTMLAttributes<HTMLElement> & { inline?: boolean },
            ) => {
              const { inline, children, ...rest } = props;
              // inline is now recognized as any, so no TS error
              if (!inline) {
                const text = React.Children.toArray(children)
                  .map((c) => (typeof c === "string" ? c : ""))
                  .join("");
                return <SampleIO text={text} />;
              }
              return <code {...rest}>{children}</code>;
            },
          }}
        >
          {problem.statement.replace(/__([^_\n]+)__/g, '<u>$1</u>')}
        </ReactMarkdown>
      </div>
    </main>
  );
}

function SampleIO({ text }: { text: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (ref.current) {
      navigator.clipboard.writeText(ref.current.innerText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      });
    }
  };
  return (
    <div className="mb-6">
      <div className="relative bg-muted border p-4 rounded-md">
        <button
          onClick={copy}
          className="absolute top-2 right-2 bg-background border px-2 py-1 rounded text-sm flex items-center gap-1 hover:bg-muted transition-colors"
        >
          <FontAwesomeIcon icon={copied ? faCheck : faClone} />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <pre ref={ref} className="whitespace-pre-wrap text-foreground">
          <code>{text}</code>
        </pre>
      </div>
    </div>
  );
}
