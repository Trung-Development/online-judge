import ProblemPage from "./ProblemPage";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import remarkHeadingSeparator from "@/lib/remarkHeadingSeparator";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { transformerCopyButton } from "@rehype-pretty/transformers";
import { Metadata } from "next";
import { Config } from "../../../config";
import { forbidden, notFound } from "next/navigation";
import { getProblem } from "@/lib/server-actions/problems";
import { getAuthSession } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const session = await getAuthSession();
    const problem = await getProblem(slug, session?.sessionToken);
    if (!problem) {
      return {
        title: `No such problem - ${Config.siteDescription}`,
        description: "Problem not found",
      };
    }
    return {
      title: `${problem.name} - ${Config.siteDescription}`,
      description: problem.body,
    };
  } catch {
    return {
      title: `No such problem - ${Config.siteDescription}`,
      description: "Problem not found",
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getAuthSession();
  const problem = await getProblem(slug, session?.sessionToken);

  if (!problem || problem == 404) notFound();
  else if (problem == 403) forbidden();

  // Server-side render the problem description to HTML using unified
  let renderedDescription: string = "";
  try {
    const md = problem.description ?? "";
    // Combined rehype plugin: table CSS inject + header css inject
    const rehypeCustomStyleAndHeaders = () => {
      // minimal HAST element shape we need
      type HastNode = {
        type?: string;
        tagName?: string;
        properties?: Record<string, unknown>;
        children?: unknown[];
      } & Record<string, unknown>;
      return (tree: unknown) => {
        function walk(node: unknown) {
          if (!node || typeof node !== "object") return;
          const n = node as HastNode;
          const children = n.children;
          if (!children || !Array.isArray(children)) return;
          for (let i = 0; i < children.length; i++) {
            const child = children[i] as HastNode | undefined;
            if (!child || child.type !== "element") continue;

            /* Table CSS inject */
            // Wrap <table> with <div class="table-wrapper figure-table">
            if (child.tagName === "table") {
              const wrapper: HastNode = {
                type: "element",
                tagName: "div",
                properties: { className: ["table-wrapper", "figure-table"] },
                children: [child],
              };
              children[i] = wrapper as unknown;
              // don't descend into this table now
              continue;
            }

            // ensure images carry a decorative outline class so CSS applies
            if (child.tagName === "img") {
              const props = (child.properties || {}) as Record<string, unknown>;
              const existing = Array.isArray(props.className)
                ? props.className.map(String)
                : props.className
                ? [String(props.className)]
                : [];
              if (!existing.includes("decor-outline"))
                existing.push("decor-outline");
              props.className = existing;
              child.properties = props;
            }

            // Add wiki-inline-code class to inline <code> so backported CSS targets it
            if (child.tagName === "code") {
              const props = (child.properties || {}) as Record<string, unknown>;
              const existing = Array.isArray(props.className)
                ? props.className.map(String)
                : props.className
                ? [String(props.className)]
                : [];
              if (!existing.includes("wiki-inline-code")) existing.push("wiki-inline-code");
              props.className = existing;
              child.properties = props;
            }

            /* header css inject */
            if (
              child.tagName === "h1" ||
              child.tagName === "h2" ||
              child.tagName === "h3"
            ) {
              const props = (child.properties || {}) as Record<string, unknown>;
              const existing = Array.isArray(props.className)
                ? props.className.map(String)
                : props.className
                ? [String(props.className)]
                : [];
              if (child.tagName === "h1") {
                if (!existing.includes("text-2xl"))
                  existing.push("text-2xl", "font-bold", "mt-6", "mb-4");
              } else if (child.tagName === "h2") {
                if (!existing.includes("text-xl"))
                  existing.push("text-xl", "font-semibold", "mt-5", "mb-3");
              } else if (child.tagName === "h3") {
                if (!existing.includes("text-lg"))
                  existing.push("text-lg", "font-semibold", "mt-4", "mb-2");
              }
              props.className = existing;
              child.properties = props;
            }

              // Add list container classes for targeted styling
              if (child.tagName === "ul" || child.tagName === "ol" || child.tagName === "dl") {
                const props = (child.properties || {}) as Record<string, unknown>;
                const existing = Array.isArray(props.className)
                  ? props.className.map(String)
                  : props.className
                  ? [String(props.className)]
                  : [];
                // mark task-list/contains-task-list if present in items
                if (child.tagName === "ul" || child.tagName === "ol") {
                  if (!existing.includes("wiki-list")) existing.push("wiki-list");
                }
                if (child.tagName === "dl") {
                  if (!existing.includes("wiki-dl")) existing.push("wiki-dl");
                }
                props.className = existing;
                child.properties = props;
              }

            // recurse
            walk(child);
          }
        }
        walk(tree);
      };
    };

    // Preprocess legacy underline markup: convert __text__ to <u>text</u>
    const preprocessed = md.replace(/__([^_\n]+)__/g, "<u>$1</u>");

    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkHeadingSeparator)
      .use(remarkBreaks)
      .use(remarkRehype)
      .use(rehypeRaw)
      .use(rehypeCustomStyleAndHeaders)
      .use(rehypePrettyCode, {
        // theme: "github-light",
        keepBackground: true,
        transformers: [
          transformerCopyButton({
            visibility: "always",
            feedbackDuration: 3000,
          }),
        ],
      })
      .use(rehypeKatex)
      .use(rehypeStringify)
      .process(preprocessed);
    renderedDescription = String(file);
  } catch {
    /* empty */
  }

  return (
    <ProblemPage
      problem={problem}
      slug={slug}
      renderedDescription={renderedDescription}
    />
  );
}
