"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

import "katex/dist/katex.min.css";
import styles from "./ProblemPage.module.css";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { canEditProblemTestcases, hasPermission, UserPermissions } from "@/lib/permissions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faFilePdf,
  faClock,
  faServer,
  faPencilSquare,
  faKeyboard,
  faPrint,
  faChevronRight,
  faChevronDown,
  faDatabase,
  faRectangleList,
  faAddressBook,
  faCog,
} from "@fortawesome/free-solid-svg-icons";

import { IProblemPageData } from "@/types";
import { languages } from "@/constants";

interface ProblemPageProps {
  problem: IProblemPageData;
  slug: string;
  renderedDescription: string;
}

export default function ProblemPage({
  problem,
  slug,
  renderedDescription,
}: ProblemPageProps) {
  const { user, isAuthenticated } = useAuth();
  const renderedRef = useRef<HTMLDivElement | null>(null);
  const [typeExpanded, setTypeExpanded] = useState(false);
  const [sourceExpanded, setSourceExpanded] = useState(true);
  const [langExpanded, setLangExpanded] = useState(true); // default open

  // Check if current user can edit test cases
  const canUserEditTestcases =
    !problem.isDeleted && !problem.isLocked &&
    canEditProblemTestcases(
      user?.perms,
      problem.author,
      problem.curator,
      user?.username
    );
  const canEditProblemInfo = !problem.isDeleted && (problem.author.includes(user?.username || "") || problem.curator.includes(user?.username || "") || hasPermission(user?.perms, UserPermissions.MODIFY_ALL_PROBLEMS));

  const canViewEditSection = !problem.isDeleted && user && (canUserEditTestcases || canEditProblemInfo);

  // Extract unique common names from allowed languages
  const allowedLanguageNames = Array.from(
    new Set(
      problem.allowedLanguages
        .map(
          (langValue) =>
            languages.find((lang) => lang.value === langValue)?.commonName
        )
        .filter(Boolean)
    )
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
        <h1
          className={`flex items-center gap-2 text-3xl font-bold ${problem.isDeleted
            ? "text-red-500"
            : problem.isLocked
              ? "text-yellow-500"
              : ""
            }`}
        >
          {problem.isLocked && <span>🔒</span>}
          {problem.isDeleted && <span>⛔</span>}
          <span>{problem.name}</span>
        </h1>
        <Link
          href={`/api/problem/${slug}/pdf`}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <FontAwesomeIcon icon={faFilePdf} />
          View as PDF
        </Link>
      </div>
      <hr className="border-gray-300" />

      {/* Main Content Layout */}
      <div className="flex flex-col-reverse lg:flex-row lg:gap-6">
        {/* Left Content - Problem Statement */}
        <div className="lg:flex-1 lg:w-[70%]">
          {/* PDF Viewer (if available) */}
          {problem.pdf && (
            <div className="w-full mb-6" style={{ height: "auto" }}>
              <PDFViewer
                src={`/api/pdf/${slug + "/" + problem.pdf}`}
                title={`${problem.name} PDF Statement`}
              />
            </div>
          )}

          {/* Statement + SampleIO and separators */}
          <div className={`prose max-w-none ${styles.problemProse}`}>
            <div
              ref={renderedRef}
              className="markdown-rendered content-description"
              // content is produced server-side by unified + rehype-pretty-code
              dangerouslySetInnerHTML={{ __html: renderedDescription }}
            />
          </div>
        </div>

        {/* Right Sidebar - Problem Info */}
        <div className="lg:w-[200px] lg:min-w-[200px] mb-6 lg:mb-0">
          <div className="lg:sticky lg:top-4">
            {/* Mobile: Show as card, Desktop: Show as sidebar */}
            <div className="lg:space-y-4">
              {/* Buttons */}
              <div
                aria-disabled
                className="bg-card border p-4 rounded-md text-sm text-card-foreground lg:bg-transparent lg:border-0 lg:p-0 text-lg"
              >
                <div className="flex flex-col gap-2">
                  {problem.isLocked ? (
                    <Button disabled className="w-full">
                      Problem locked
                    </Button>
                  ) : problem.isDeleted ?
                    <Button disabled className="w-full">
                      Problem deleted
                    </Button> : (
                      <Button asChild className="w-full">
                        {isAuthenticated ? (<Link href={`/problem/${slug}/submit`}>Submit</Link>) : <Link href={`/accounts/login?callbackUrl=/problem/${slug}/submit`}>Log in to submit</Link>}
                      </Button>
                    )}
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/submissions?problemSlug=${slug}`}>
                      <FontAwesomeIcon
                        icon={faRectangleList}
                        className="w-4 h-4 mr-2"
                      />
                      All Submissions
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link
                      href={`/submissions?problemSlug=${slug}&mySubmissions`}
                    >
                      <FontAwesomeIcon
                        icon={faAddressBook}
                        className="w-4 h-4 mr-2"
                      />
                      My Submissions
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
                        {problem.author.map((username: string, idx: number) => {
                          return (
                            <React.Fragment key={username}>
                              <Link
                                href={`/user/${username}`}
                                className="text-foreground underline"
                              >
                                {username}
                              </Link>
                              {idx < problem.author.length - 1 && ", "}
                            </React.Fragment>
                          );
                        })}
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
                        Problem types{problem.type.length > 1 ? "s" : ""}
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${typeExpanded
                        ? "max-h-64 opacity-100 mt-2"
                        : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="text-foreground ml-5">
                        {problem.type.join(", ")}
                      </div>
                    </div>
                  </div>
                  {problem.problemSource ? (
                    <div>
                      <button
                        onClick={() => setSourceExpanded(!sourceExpanded)}
                        className="flex items-center gap-2 w-full text-left hover:opacity-70 transition-opacity"
                      >
                        <FontAwesomeIcon
                          icon={sourceExpanded ? faChevronDown : faChevronRight}
                          className="text-primary w-3 transition-transform duration-200"
                        />
                        <span className="font-bold text-foreground">
                          Problem source
                        </span>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${sourceExpanded
                          ? "max-h-64 opacity-100 mt-2"
                          : "max-h-0 opacity-0"
                          }`}
                      >
                        <div className="text-foreground ml-5">
                          {problem.problemSource}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <></>
                  )}
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
                        Allowed languages
                        {allowedLanguageNames.length > 1 ? "s" : ""}
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${langExpanded
                        ? "max-h-96 opacity-100 mt-2"
                        : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="text-foreground ml-5 max-h-96 overflow-y-auto">
                        {allowedLanguageNames.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {canViewEditSection && (<>
                {/* Separator */}
                < hr className="hidden lg:block border-gray-300 lg:border-gray-200" />

                {/* Edit Problem Info */}
                <div className="bg-card border p-4 rounded-md text-sm text-card-foreground lg:bg-transparent lg:border-0 lg:p-0 mt-4 lg:mt-0 text-lg">
                  <div className="flex flex-col gap-2">
                    {canUserEditTestcases && (
                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/problem/${slug}/testcases`}>
                          <FontAwesomeIcon
                            icon={faDatabase}
                            className="w-4 h-4 mr-2"
                          />
                          Edit test data
                        </Link>
                      </Button>
                    )}
                    {canEditProblemInfo && (
                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/problem/${slug}/manage`}>
                          <FontAwesomeIcon
                            icon={faCog}
                            className="w-4 h-4 mr-2"
                          />
                          Manage problem
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </>)}
            </div>
          </div>
        </div>
      </div>
    </main>
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
            html?.offsetHeight || 0
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
