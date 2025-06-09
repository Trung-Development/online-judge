"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faClone, faFilePdf } from "@fortawesome/free-solid-svg-icons";

interface ProblemData {
  name: string;
  statement: string;
  timeLimit: number; // in seconds
  memoryLimit: number; // in MB
  input: string;
  output: string;
  author: string;
  problemType: string;
  // allowedLanguages: string[];
}

export default function ProblemPage() {
  const params = useParams();
  const slug = params.slug;
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/problem/${slug}`)
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          throw new Error(`Expected JSON, got ${ct}`);
        }
        return res.json();
      })
      .then((data) => {
        setProblem(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false); // don't hang on loading
      });
  }, [slug]);

  if (loading || !problem) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto py-8 px-4">
        {/* Title and PDF link */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">{problem.name}</h1>
          <Link
            href={`/api/problem/${slug}/pdf`}
            className="text-sm text-blue-600 hover:underline"
          >
            <FontAwesomeIcon icon={faFilePdf} className="mr-1" />
            View as PDF
          </Link>
        </div>

        {/* Submit and Discussion Buttons */}
        <div className="flex gap-2 mb-6">
          <Button asChild>
            <Link href={`/problem/${slug}/submit`}>Submit Solution</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/problem/${slug}/discuss`}>Discussion</Link>
          </Button>
        </div>

        {/* Metadata Box */}
        <div className="bg-white border border-gray-200 rounded-md p-4 mb-6">
          <div className="flex justify-between text-sm">
            <div>
              <strong>Time limit:</strong> {problem.timeLimit}s
            </div>
            <div>
              <strong>Memory limit:</strong> {problem.memoryLimit} MB
            </div>
          </div>
          <div className="mt-2 text-sm">
            <div>
              <strong>Input:</strong> {problem.input}
            </div>
            <div>
              <strong>Output:</strong> {problem.output}
            </div>
          </div>
          <div className="mt-2 text-sm">
            <div>
              <strong>Author:</strong> {problem.author}
            </div>
            <div>
              <strong>Type:</strong> {problem.problemType}
            </div>
            {/* <div><strong>Allowed languages:</strong> {problem.allowedLanguages.join(', ')}</div> */}
          </div>
        </div>

        {/* Statement */}
        <div className="prose max-w-none">
          {/* Statement */}
          <div className="prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                h1: ({ node, ...props }: any) => (
                  <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
                ),
                h2: ({ node, ...props }: any) => (
                  <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />
                ),
                h3: ({ node, ...props }: any) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
                ),
                code: (props: any) => {
                  const { inline, children, ...rest } = props;
                  if (!inline) {
                    // render sample IO style
                    const text = React.Children.toArray(children)
                      .map((c) => (typeof c === "string" ? c : ""))
                      .join("");
                    return <SampleIO text={text} />;
                  }
                  return <code {...rest}>{children}</code>;
                },
              }}
            >
              {wrapTabbedBlocks(problem.statement)}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
}

function SampleIO({ text }: { text: string }) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (codeRef.current) {
      navigator.clipboard.writeText(codeRef.current.innerText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      });
    }
  };
  return (
    <div className="mb-6">
      <div className="relative bg-gray-50 border border-gray-300 rounded-md">
        <button
          onClick={copy}
          className="absolute top-2 right-2 px-2 py-1 text-sm bg-white border rounded hover:bg-gray-100 flex items-center gap-1"
        >
          <FontAwesomeIcon icon={copied ? faCheck : faClone} />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <pre className="p-4 whitespace-pre-wrap" ref={codeRef}>
          <code>{text}</code>
        </pre>
      </div>
    </div>
  );
}

// Preprocess: wrap only tab-indented blocks into fenced code
function wrapTabbedBlocks(md: string): string {
  return md.replace(/((?:^\t+.*\n)+)/gm, (match) => {
    const content = match
      .split(/\r?\n/)
      .map((line) => line.replace(/^\t+/, ""))
      .filter((l) => l.length)
      .join("\n");
    return `\n\`\`\`\n${content}\n\`\`\`\n`;
  });
}
