"use client";

import React, { useRef, useState, ReactNode } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClone, faCheck } from "@fortawesome/free-solid-svg-icons";
import "katex/dist/katex.min.css";
import type { JSX } from "react";

interface ISampleIOProps {
  text: string;
}

function SampleIO({ text }: ISampleIOProps): JSX.Element {
  const codeRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const copy = (): void => {
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

function wrapTabbedBlocks(md: string): string {
  return md.replace(/((?:^\t+.*\n)+)/gm, (match: string) => {
    const content = match
      .split(/\r?\n/)
      .map((line) => line.replace(/^\t+/, ""))
      .filter((l) => l.length)
      .join("\n");
    return `\n\`\`\`\n${content}\n\`\`\`\n`;
  });
}

export default function TestMDPage(): JSX.Element {
  const raw = `
# Problem Statement

Here is a description.

Sth here

	1
	2

## Sample Input

	2
	1 1
	-1 0

## Sample Output

	2
	-1
`;

  // 1) convert tildes to math
  const mathMd: string = raw.replace(
    /~([^~]+)~/g,
    (_m: string, g1: string) => `$${g1}$`,
  );
  // 2) wrap only tab-indented lines into fenced code
  const finalMd: string = wrapTabbedBlocks(mathMd);

  interface ICodeProps
    extends React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > {
    inline?: boolean;
    children: ReactNode;
    className?: string;
  }

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <div className="prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={
            {
              // Style headings explicitly
              h1: (props: React.ComponentProps<"h1">) => (
                <h1 className="text-3xl font-bold mt-4 mb-2" {...props} />
              ),
              h2: (props: React.ComponentProps<"h2">) => (
                <h2 className="text-2xl font-semibold mt-3 mb-1.5" {...props} />
              ),
              h3: (props: React.ComponentProps<"h3">) => (
                <h3 className="text-xl font-semibold mt-3 mb-1" {...props} />
              ),
              code: ((props: ICodeProps) => {
                const { inline, children, className, ...rest } = props;
                if (!inline) {
                  const text = React.Children.toArray(children)
                    .map((c) => (typeof c === "string" ? c : ""))
                    .join("");
                  return <SampleIO text={text} />;
                }
                return (
                  <code className={className} {...rest}>
                    {children}
                  </code>
                );
              }) as Components["code"],
            } as Components
          }
        >
          {finalMd}
        </ReactMarkdown>
      </div>
    </main>
  );
}
