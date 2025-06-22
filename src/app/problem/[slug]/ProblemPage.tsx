"use client";

import React, { useEffect, useRef, useState } from "react";
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
import {
  faCheck,
  faClone,
  faFilePdf,
  faClock,
  faServer,
  faPencilSquare,
  faKeyboard,
  faPrint,
  faChevronRight,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

import { IProblemData } from "@/types";
import { languages } from "@/constants";

interface ProblemPageProps {
  problem: IProblemData;
  slug: string;
}

export default function ProblemPage({ problem, slug }: ProblemPageProps) {
  const [typeExpanded, setTypeExpanded] = useState(false);
  const [langExpanded, setLangExpanded] = useState(true); // default open

  // Extract unique common names from allowed languages
  const allowedLanguageNames = Array.from(
    new Set(
      problem.allowedLanguages
        .map(
          (langValue) =>
            languages.find((lang) => lang.value === langValue)?.commonName,
        )
        .filter(Boolean),
    ),
  ).sort();

  // Helper to format memory limit
  function formatMemoryLimit(memoryLimit: number) {
    if (memoryLimit >= 1024) {
      // Show up to 1 decimal if not integer
      const gb = memoryLimit / 1024;
      return gb % 1 === 0 ? `${gb}G` : `${parseFloat(gb.toFixed(1))}G`;
    }
    return `${memoryLimit}M`;
  }

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
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

      {/* Main Content Layout */}
      <div className="flex flex-col-reverse lg:flex-row lg:gap-6">
        {/* Left Content - Problem Statement */}
        <div className="lg:flex-1 lg:w-[70%]">
          {/* PDF Viewer (if available) */}
          {problem.pdf && (
            <div className="w-full mb-6" style={{ height: "auto" }}>
              <PDFViewer
                src={`/pdf/${problem.pdf}`}
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
                  props: React.HTMLAttributes<HTMLElement> & {
                    inline?: boolean;
                  },
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
              {problem.body.replace(/__([^_\n]+)__/g, "<u>$1</u>")}
            </ReactMarkdown>
          </div>
        </div>

        {/* Right Sidebar - Problem Info */}
        <div className="lg:w-[200px] lg:min-w-[200px] mb-6 lg:mb-0">
          <div className="lg:sticky lg:top-4">
            {/* Mobile: Show as card, Desktop: Show as sidebar */}
            <div className="lg:space-y-4">
              {/* Buttons */}
              <div className="bg-card border p-4 rounded-md text-sm text-card-foreground lg:bg-transparent lg:border-0 lg:p-0 text-lg">
                <div className="flex flex-col gap-2">
                  <Button asChild className="w-full">
                    <Link href={`/problem/${slug}/submit`}>
                      Submit solution
                    </Link>
                  </Button>
                  {problem.solution && (
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/problem/${slug}/solution`}>
                        Read editorial
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Separator */}
              <hr className="hidden lg:block border-gray-300 lg:border-gray-200" />

              {/* Points, TL, ML */}
              <div className="bg-card border p-4 rounded-md text-sm text-card-foreground lg:bg-transparent lg:border-0 lg:p-0 mt-4 lg:mt-0 text-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="text-primary w-4"
                    />
                    <span className="font-bold text-foreground">Points:</span>
                    <span className="text-foreground">{problem.points}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faClock}
                      className="text-primary w-4"
                    />
                    <span className="font-bold text-foreground">
                      Time limit:
                    </span>
                    <span className="text-foreground">
                      {problem.timeLimit}s
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faServer}
                      className="text-primary w-4"
                    />
                    <span className="font-bold text-foreground">
                      Memory limit:
                    </span>
                    <span className="text-foreground">
                      {formatMemoryLimit(problem.memoryLimit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <hr className="hidden lg:block border-gray-300 lg:border-gray-200" />

              {/* I/O Information */}
              <div className="bg-card border p-4 rounded-md text-sm text-card-foreground lg:bg-transparent lg:border-0 lg:p-0 mt-4 lg:mt-0 text-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faKeyboard}
                      className="text-primary w-4"
                    />
                    <span className="font-bold text-foreground">Input: </span>
                    <span className="text-foreground">{problem.input}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faPrint}
                      className="text-primary w-4"
                    />
                    <span className="font-bold text-foreground">Output: </span>
                    <span className="text-foreground">{problem.output}</span>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <hr className="hidden lg:block border-gray-300 lg:border-gray-200" />

              {/* Author, type, Allowed Languages */}
              <div className="bg-card border p-4 rounded-md text-sm text-card-foreground lg:bg-transparent lg:border-0 lg:p-0 mt-4 lg:mt-0 text-lg">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon
                      icon={faPencilSquare}
                      className="text-primary w-4 mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-foreground">Author:</div>
                      <div className="text-foreground">
                        {problem.author.map((username: string, idx: number) => (
                          <React.Fragment key={username}>
                            <Link
                              href={`/user/${username}`}
                              className="text-foreground"
                            >
                              {username}
                            </Link>
                            {idx < problem.author.length - 1 && ", "}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => setTypeExpanded(!typeExpanded)}
                      className="flex items-center gap-2 w-full text-left hover:opacity-70 transition-opacity"
                    >
                      <FontAwesomeIcon
                        icon={typeExpanded ? faChevronDown : faChevronRight}
                        className="text-primary w-3 transition-transform duration-200"
                      />
                      <span className="font-bold text-foreground">
                        Problem type{problem.type.length > 1 ? "s" : ""}
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        typeExpanded
                          ? "max-h-32 opacity-100 mt-2"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="text-foreground ml-5">
                        {problem.type.join(", ")}
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => setLangExpanded(!langExpanded)}
                      className="flex items-center gap-2 w-full text-left hover:opacity-70 transition-opacity"
                    >
                      <FontAwesomeIcon
                        icon={langExpanded ? faChevronDown : faChevronRight}
                        className="text-primary w-3 transition-transform duration-200"
                      />
                      <span className="font-bold text-foreground">
                        Allowed language
                        {allowedLanguageNames.length > 1 ? "s" : ""}
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        langExpanded
                          ? "max-h-32 opacity-100 mt-2"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="text-foreground ml-5">
                        {allowedLanguageNames.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

function PDFViewer({ src, title }: { src: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      try {
        // Try to access the PDF's document height (works only if same-origin)
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          const html = doc.documentElement;
          const body = doc.body;
          const height = Math.max(
            body?.scrollHeight || 0,
            html?.scrollHeight || 0,
            body?.offsetHeight || 0,
            html?.offsetHeight || 0,
          );
          if (height > 0) {
            iframe.style.height = `${height}px`;
          }
        }
      } catch {
        // If cross-origin, fallback to a default height
        iframe.style.height = "80vh";
      }
    };

    iframe.addEventListener("load", onLoad);
    return () => {
      iframe.removeEventListener("load", onLoad);
    };
  }, [src]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      className="w-full border rounded-md"
      title={title}
      style={{ minHeight: 400, height: "auto" }}
    />
  );
}
