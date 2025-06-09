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

interface ProblemData {
  name: string;
  statement: string;
  timeLimit: number;
  memoryLimit: number;
  input: string;
  output: string;
  author: string;
  problemType: string;
}

export default function ProblemPage() {
  const slug = useParams().slug;
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/problem/${slug}`)
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error(`Expected JSON, got ${ct}`);
        return res.json();
      })
      .then((data) => {
        setProblem(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  if (loading || !problem) return <div>Loading...</div>;

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      {/* Title & PDF */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">{problem.name}</h1>
        <Link href={`/api/problem/${slug}/pdf`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <FontAwesomeIcon icon={faFilePdf} />
          View as PDF
        </Link>
      </div>
      <hr className="border-gray-300 mb-6" />

      {/* Buttons */}
      <div className="flex gap-2 mb-6">
        <Button asChild><Link href={`/problem/${slug}/submit`}>Submit</Link></Button>
        <Button variant="outline" asChild><Link href={`/problem/${slug}/discuss`}>Discussion</Link></Button>
      </div>

      {/* Metadata */}
      <div className="bg-white border p-4 mb-6 rounded-md text-sm">
        <div className="flex justify-between">
          <div><strong>Time:</strong> {problem.timeLimit}s</div>
          <div><strong>Memory:</strong> {problem.memoryLimit} MB</div>
        </div>
        <div className="mt-2">
          <div><strong>Input:</strong> {problem.input}</div>
          <div><strong>Output:</strong> {problem.output}</div>
        </div>
        <div className="mt-2">
          <div><strong>Author:</strong> {problem.author}</div>
          <div><strong>Type:</strong> {problem.problemType}</div>
        </div>
      </div>

      {/* Statement + SampleIO and separators */}
      <div className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath, remarkHeadingSeparator]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            h1: (props: any) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
            h2: (props: any) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
            h3: (props: any) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
            code: (props: any) => {
              const { inline, children, ...rest } = props;
              // inline is now recognized as any, so no TS error
              if (!inline) {
                const text = React.Children.toArray(children)
                  .map(c => typeof c === "string" ? c : "")
                  .join("");
                return (
                  <SampleIO text={text} />
                );
              }
              return <code {...rest}>{children}</code>;
            }
          }}
        >
          {problem.statement}
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
      navigator.clipboard.writeText(ref.current.innerText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        });
    }
  };
  return (
    <div className="mb-6">
      <div className="relative bg-gray-50 border p-4 rounded-md">
        <button onClick={copy} className="absolute top-2 right-2 bg-white border px-2 py-1 rounded text-sm flex items-center gap-1 hover:bg-gray-100">
          <FontAwesomeIcon icon={copied ? faCheck : faClone} />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <pre ref={ref} className="whitespace-pre-wrap"><code>{text}</code></pre>
      </div>
    </div>
  );
}
