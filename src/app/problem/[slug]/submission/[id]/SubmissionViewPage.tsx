"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IProblemPageData } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { languages } from "@/constants";
import { CodeHighlight } from "@/components/ui/code-highlight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCode,
  faCheck,
  faSpinner,
  faExclamationTriangle,
  faTimes,
  faUser,
  faCalendar,
  faEye,
  faPlay,
  faStop,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

interface SubmissionViewPageProps {
  problem: IProblemPageData;
  slug: string;
  submissionId: number;
}

interface SubmissionDetail {
  id: number;
  verdict: string;
  language: string;
  code: string;
  points: number;
  maxTime?: number;
  maxMemory?: number;
  compileTime?: number;
  errorMessage?: string;
  createdAt: string;
  judgingStartedAt?: string;
  judgingEndedAt?: string;
  isLocked: boolean;
  testCases: Array<{
    id: number;
    verdict: string;
    points: number;
    time: number;
    memory: number;
    position: number;
    output?: string;
    feedback?: string;
    input?: string;
    expected?: string;
  }>;
  author: {
    id: string;
    username: string;
  };
}

export default function SubmissionViewPage({ problem, slug, submissionId }: SubmissionViewPageProps) {
  const { sessionToken } = useAuth();
  // const router = useRouter();
  
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for collapsible test case sections
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  // Helper function to toggle expanded sections
  const toggleSection = (testCaseId: number, sectionType: string) => {
    const key = `${testCaseId}-${sectionType}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Check if a section is expanded
  const isSectionExpanded = (testCaseId: number, sectionType: string) => {
    const key = `${testCaseId}-${sectionType}`;
    return expandedSections[key] || false;
  };

  // Get language display name
  const getLanguageLabel = (langValue: string) => {
    const lang = languages.find(l => l.value === langValue);
    return lang ? lang.label : langValue;
  };

  // Verdict helpers
  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "AC":
        return <FontAwesomeIcon icon={faCheck} className="text-green-600" />;
      case "WA":
      case "TLE":
      case "MLE":
      case "RTE":
      case "CE":
        return <FontAwesomeIcon icon={faTimes} className="text-red-600" />;
      case "RN":
        return <FontAwesomeIcon icon={faSpinner} className="text-blue-600 animate-spin" />;
      case "QU":
        return <FontAwesomeIcon icon={faSpinner} className="text-yellow-600" />;
      default:
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-gray-600" />;
    }
  };

  const formatMemory = (kb: number): string => {
    return `${(kb / 1024).toFixed(1)}MB`;
  };

  const getVerdictText = (verdict: string) => {
    const verdictMap: { [key: string]: string } = {
      AC: "Accepted",
      WA: "Wrong Answer",
      TLE: "Time Limit Exceeded",
      MLE: "Memory Limit Exceeded",
      RTE: "Runtime Error",
      CE: "Compilation Error",
      RN: "Running",
      QU: "In Queue",
      PE: "Presentation Error",
      OLE: "Output Limit Exceeded",
      AB: "Aborted",
      IR: "Invalid Return",
      ISE: "Internal Server Error",
      SK: "Skipped",
    };
    return verdictMap[verdict] || verdict;
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "AC":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "WA":
      case "TLE":
      case "MLE":
      case "RTE":
      case "CE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "RN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "QU":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Invalid Date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  // Load submission data
  useEffect(() => {
    const loadSubmission = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/submissions/${submissionId}`, {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json();
          if(errorData.error == 'SUBMISSION_NOT_FOUND' || errorData.error == 'INVALID_SUBMISSION') throw new Error("No submission with the provided ID found. Please double check your spelling or try again later.")
          if(errorData.error == 'SUBMISSION_NOT_VIEWABLE') throw new Error("You do not have permission to view this submission. Please check your access rights or contact an administrator.");

          throw new Error(errorData.error || "Failed to load submission");
        }

        const submissionData = await response.json();
        setSubmission(submissionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadSubmission();
  }, [submissionId]);

  // Helper function to check if submission has final verdict
  const hasFinalVerdict = (verdict: string) => {
    // Final verdicts are those that won't change anymore
    const finalVerdicts = ['AC', 'WA', 'TLE', 'MLE', 'RTE', 'CE', 'PE', 'OLE', 'AB', 'IR', 'ISE'];
    return finalVerdicts.includes(verdict);
  };

  // Polling for submission updates (only when needed)
  useEffect(() => {
    // if (!sessionToken) return;
    
    let isActive = true;

    const pollSubmission = async () => {
      if (!isActive) return;
      
      try {
        const response = await fetch(`/api/submissions/${submissionId}`, {
          headers: {
            Authorization: sessionToken ? `Bearer ${sessionToken}` : "",
          },
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && isActive) {
            setSubmission(result.data);
            
            // Continue polling if verdict is not final
            if (!hasFinalVerdict(result.data.verdict)) {
              scheduleNextPoll();
            }
          }
        }
      } catch (error) {
        console.error('Error polling submission:', error);
        if (isActive) {
          scheduleNextPoll(); // Retry on error
        }
      }
    };

    const scheduleNextPoll = () => {
      if (!isActive) return;
      
      // Poll every 0.5 seconds (500ms)
      setTimeout(() => {
        if (isActive) {
          pollSubmission();
        }
      }, 500);
    };

    // Initial fetch
    pollSubmission();

    // Cleanup function
    return () => {
      isActive = false;
    };
  }, [submissionId, sessionToken]); // Simplified dependencies

  // // Redirect if not authenticated
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push(`/accounts/login?callbackUrl=/problem/${slug}/submission/${submissionId}`);
  //   }
  // }, [isAuthenticated, router, slug, submissionId]);

  // if (!isAuthenticated) {
  //   return (
  //     <div className="max-w-7xl mx-auto py-8 px-4">
  //       <Alert variant="warning">
  //         <FontAwesomeIcon icon={faExclamationTriangle} />
  //         <AlertDescription>
  //           Please log in to view submission details.
  //         </AlertDescription>
  //       </Alert>
  //     </div>
  //   );
  // }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin w-8 h-8 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <FontAwesomeIcon icon={faTimes} />
          <AlertDescription>
            {error || "Submission not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/problem/${slug}`}>
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
            Back to Problem
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Submission #{submission.id}</h1>
          <p className="text-muted-foreground">{problem.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getVerdictIcon(submission.verdict)}
                <div>
                  <div className="flex items-center gap-2">
                    Submission #{submission.id}
                    <Badge className={getVerdictColor(submission.verdict)}>
                      {getVerdictText(submission.verdict)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal">
                    {getLanguageLabel(submission.language)}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Points:</span>
                  <div className="text-lg font-bold">
                    {submission.points}/{problem.points}
                  </div>
                </div>
                
                {submission.maxTime !== undefined && submission.maxTime !== null && (
                  <div>
                    <span className="font-medium text-muted-foreground">Max Time:</span>
                    <div className="text-lg font-bold">
                      {submission.maxTime.toFixed(3)}s
                    </div>
                  </div>
                )}
                
                {submission.maxMemory !== undefined && submission.maxMemory !== null && (
                  <div>
                    <span className="font-medium text-muted-foreground">Max Memory:</span>
                    <div className="text-lg font-bold">
                      {formatMemory(submission.maxMemory)}
                    </div>
                  </div>
                )}
                
                {submission.compileTime !== undefined && submission.compileTime !== null && (
                  <div>
                    <span className="font-medium text-muted-foreground">Compile Time:</span>
                    <div className="text-lg font-bold">
                      {submission.compileTime.toFixed(3)}s
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {submission.errorMessage && (
                <Alert variant="destructive">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <AlertDescription>
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {submission.errorMessage}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Test Cases */}
          {submission.testCases && submission.testCases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Test Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {submission.testCases.map((testCase) => {
                    // Check if there's any detailed data to show
                    const hasDetailedData = (testCase.input && testCase.input.trim()) || 
                                          (testCase.expected && testCase.expected.trim()) || 
                                          (testCase.output && testCase.output.trim()) || 
                                          (testCase.feedback && testCase.feedback.trim());

                    return (
                      <div key={testCase.id} className="border rounded-lg p-4">
                        {/* Test case header with conditional expand/collapse button */}
                        <div 
                          className={`flex items-center justify-between ${hasDetailedData ? 'cursor-pointer' : ''}`}
                          onClick={hasDetailedData ? () => toggleSection(testCase.id, 'details') : undefined}
                        >
                          <div className="flex items-center gap-2">
                            {getVerdictIcon(testCase.verdict)}
                            <span className="font-medium">Test Case {testCase.position}</span>
                            <Badge className={getVerdictColor(testCase.verdict)}>
                              {getVerdictText(testCase.verdict)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              {testCase.points}/{problem.points}pts
                            </div>
                            {hasDetailedData && (
                              <FontAwesomeIcon 
                                icon={isSectionExpanded(testCase.id, 'details') ? faChevronDown : faChevronRight} 
                                className="w-4 h-4 text-muted-foreground" 
                              />
                            )}
                          </div>
                        </div>
                        {/* Basic timing and memory info (always visible) */}
                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                          <div>
                            <span className="font-medium">Time:</span> {testCase.time && typeof testCase.time === 'number' ? testCase.time.toFixed(3) : '0.000'}s
                          </div>
                          <div>
                            <span className="font-medium">Memory:</span> {testCase.memory && typeof testCase.memory === 'number' ? formatMemory(testCase.memory) : '0.0MB'}
                          </div>
                        </div>

                        {/* Collapsible detailed section - only show if there's data */}
                        {hasDetailedData && isSectionExpanded(testCase.id, 'details') && (
                          <div className="mt-4 pt-3 border-t">
                            <div className="space-y-3">
                              {testCase.input && testCase.input.trim() && (
                                <div>
                                  <div className="text-sm font-medium mb-1">Input:</div>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {testCase.input.length > 1000 ? testCase.input.substring(0, 1000) + '\n... [truncated]' : testCase.input}
                                  </pre>
                                </div>
                              )}
                              
                              {testCase.expected && testCase.expected.trim() && (
                                <div>
                                  <div className="text-sm font-medium mb-1">Expected Output:</div>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {testCase.expected.length > 1000 ? testCase.expected.substring(0, 1000) + '\n... [truncated]' : testCase.expected}
                                  </pre>
                                </div>
                              )}
                              
                              {testCase.output && testCase.output.trim() && (
                                <div>
                                  <div className="text-sm font-medium mb-1">Your Output:</div>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {testCase.output.length > 1000 ? testCase.output.substring(0, 1000) + '\n... [truncated]' : testCase.output}
                                  </pre>
                                </div>
                              )}
                            </div>
                            
                            {/* Show feedback */}
                            {testCase.feedback && testCase.feedback.trim() && (
                              <div className="mt-3">
                                <div className="text-sm font-medium mb-1">Feedback:</div>
                                <pre className="text-xs bg-red-50 text-red-800 p-2 rounded overflow-x-auto">
                                  {testCase.feedback}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source Code */}
          {submission.code && submission.code.trim() !== "" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCode} />
                  Source Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CodeHighlight 
                  code={submission.code}
                  language={submission.language}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submission Info */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-muted-foreground w-4" />
                <span className="font-medium">Author:</span>
                {submission.author ? (
                  <Link 
                    href={`/user/${submission.author.username}`}
                    className="text-primary hover:underline"
                  >
                    {submission.author.username}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendar} className="text-muted-foreground w-4" />
                <span className="font-medium">Submitted:</span>
                <span className="text-sm">
                  {formatDate(submission.createdAt)}
                </span>
              </div>
              
              {submission.judgingStartedAt && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faPlay} className="text-muted-foreground w-4" />
                  <span className="font-medium">Started:</span>
                  <span className="text-sm">
                    {formatDate(submission.judgingStartedAt)}
                  </span>
                </div>
              )}
              
              {submission.judgingEndedAt && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faStop} className="text-muted-foreground w-4" />
                  <span className="font-medium">Completed:</span>
                  <span className="text-sm">
                    {formatDate(submission.judgingEndedAt)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCode} className="text-muted-foreground w-4" />
                <span className="font-medium">Language:</span>
                <span className="text-sm">
                  {getLanguageLabel(submission.language)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEye} className="text-muted-foreground w-4" />
                <span className="font-medium">Visibility:</span>
                <span className="text-sm">
                  {submission.isLocked ? "Private" : "Public"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Problem Info */}
          <Card>
            <CardHeader>
              <CardTitle>Problem Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Points:</span>
                <span>{problem.points}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Limit:</span>
                <span>{problem.timeLimit}s</span>
              </div>
              <div className="flex justify-between">
                <span>Memory Limit:</span>
                <span>{problem.memoryLimit}MB</span>
              </div>
              <Separator className="my-2" />
              <Button asChild className="w-full" variant="outline">
                <Link href={`/problem/${slug}/submit`}>
                  Submit New Solution
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
