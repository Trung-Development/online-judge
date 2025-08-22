"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCode,
  faClock,
  faServer,
  faCheck,
  faSpinner,
  faExclamationTriangle,
  faTimes,
  faPlay,
  faExclamationCircle,
  faGlobeAsia,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/AuthProvider";
import { IProblemPageData, TAllowedLang } from "@/types";
import { languages } from "@/constants";
import { useJudgeCapabilities } from "@/hooks/use-judge-capabilities";
import { useProblemAvailability } from "@/hooks/use-problem-availability";

interface SubmitPageProps {
  problem: IProblemPageData;
  slug: string;
}

interface SubmissionResponse {
  id: number;
  verdict: string;
  points?: number;
  maxMemory?: number;
  maxTime?: number;
  errorMessage?: string;
  testCases?: Array<{
    id: number;
    verdict: string;
    points: number;
    time: number;
    memory: number;
    position: number;
    input?: string;
    expected?: string;
    output?: string;
    feedback?: string;
  }>;
}

export default function SubmitPage({ problem, slug }: SubmitPageProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Judge capabilities for availability checking
  const {
    status: judgeStatus,
    isExecutorAvailable,
    loading: judgeLoading,
    error: judgeError,
    refreshCapabilities,
  } = useJudgeCapabilities();

  // Problem availability checking
  const { checkProblemAvailability } = useProblemAvailability();
  const [isProblemAvailable, setIsProblemAvailable] = useState<boolean>(true); // Default to true
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionResponse | null>(null);


  // Check problem availability when judges status changes
  useEffect(() => {
    if (judgeStatus && judgeStatus.connected && judgeStatus.judgeCount > 0) {
      checkProblemAvailability(slug).then(setIsProblemAvailable);
    } else {
      setIsProblemAvailable(false);
    }
  }, [judgeStatus, checkProblemAvailability, slug]);

  // Filter available languages based on problem settings AND judge availability
  const availableLanguages = languages.filter(lang => 
    problem.allowedLanguages.includes(lang.value as TAllowedLang) &&
    isExecutorAvailable(lang.value)
  );

  // Polling for submission updates (instead of WebSocket to avoid CORS issues)
  useEffect(() => {
    if (!submissionId) return;

    const pollSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionId}`);
        if (response.ok) {
          const data = await response.json();
          setSubmissionStatus(data);
          
          // Stop polling if submission is complete
          if (data.verdict && data.verdict !== 'QU' && data.verdict !== 'P') {
            setIsSubmitting(false);
          }
        }
      } catch (error) {
        console.error('Error polling submission:', error);
      }
    };

    // Poll every 3 seconds
    const pollInterval = setInterval(pollSubmission, 3000);
    
    // Initial fetch
    pollSubmission();

    return () => {
      clearInterval(pollInterval);
    };
  }, [submissionId]);

  // Set default language template when language changes
  useEffect(() => {
    if (selectedLanguage) {
      const lang = languages.find(l => l.value === selectedLanguage);
      if (lang && lang.template && !code) {
        setCode(lang.template);
      }
    }
  }, [selectedLanguage, code]);

  // Redirect if not authenticated (but wait for auth loading to complete)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/accounts/login?callbackUrl=${encodeURIComponent(`/problem/${slug}/submit`)}`);
    }
  }, [isAuthenticated, authLoading, router, slug]);

  useEffect(() => {
    if(problem.isLocked) {
      setWarning("Modifications to this problem are restricted. Please contact an administrator for further assistance.");
    }
  }, [problem.isLocked])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLanguage || !code.trim()) {
      setError("Please select a language and provide your code.");
      return;
    }

    // Check judge availability
    if (!judgeStatus || !judgeStatus.connected || judgeStatus.judgeCount === 0) {
      setError("No judges are currently connected. Please try again later.");
      return;
    }

    if (!isProblemAvailable) {
      setError("This problem is not available on any connected judge. Please try again later.");
      return;
    }

    if (!isExecutorAvailable(selectedLanguage)) {
      setError(`The selected language (${selectedLanguage}) is not available on any connected judge. Please select a different language.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemSlug: slug,
          language: selectedLanguage,
          sourceCode: code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occured while submitting your solution.");
      }

      const result = await response.json();
      setSubmissionId(result.id);
      setSuccess(true);
      setError(null);
      
      // Redirect to submission view page after a short delay
      setTimeout(() => {
        router.push(`/problem/${slug}/submission/${result.id}`);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

    // Helper to format memory limit
  function formatMemoryLimit(memoryLimit: number) {
    if (memoryLimit >= 1024) {
      const gb = memoryLimit / 1024;
      return `${gb.toFixed(1)}GB`;
    }
    return `${memoryLimit}MB`;
  }

  // Helper to format memory from KB to MB
  const formatMemory = (kb: number): string => {
    return `${(kb / 1024).toFixed(1)}MB`;
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to submit a solution.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/problem/${slug}`}>
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
            Back to Problem
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Submit Solution</h1>
          <p className="text-muted-foreground">{problem.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCode} className="w-5 h-5" />
                Submit Your Solution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Language Selection */}
                <div className="space-y-2">
                  <Label htmlFor="language">Programming Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a programming language" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages
                        .filter((lang) => lang.value && lang.value.trim() !== "")
                        .map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Code Editor */}
                <div className="space-y-2">
                  <Label htmlFor="code">Source Code</Label>
                  <div className="border rounded-md overflow-hidden">
                    <Editor
                      height="500px"
                      language={
                        selectedLanguage.startsWith("PY") ? "python" :
                        selectedLanguage.startsWith("CPP") || selectedLanguage === "C" ? "cpp" :
                        selectedLanguage === "JAVA8" ? "java" :
                        selectedLanguage === "V8JS" ? "javascript" :
                        selectedLanguage === "GO" ? "go" :
                        selectedLanguage === "HASK" ? "haskell" :
                        selectedLanguage === "D" ? "d" :
                        selectedLanguage === "RUBY" || selectedLanguage === "RUBY18" ? "ruby" :
                        selectedLanguage === "PHP" ? "php" :
                        selectedLanguage === "LUA" ? "lua" :
                        selectedLanguage === "PAS" ? "pascal" :
                        "plaintext"
                      }
                      value={code}
                      onChange={(value) => setCode(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on",
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        selectOnLineNumbers: true,
                        matchBrackets: "always",
                        autoIndent: "full",
                        formatOnPaste: true,
                        formatOnType: true,
                      }}
                    />
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Warning Alert */}
                {warning && (
                  <Alert variant="warning">
                    <FontAwesomeIcon icon={faExclamationCircle} className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                )}

                {/* Success Alert */}
                {success && (
                  <Alert variant="success">
                    <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                    <AlertDescription>
                      Solution submitted successfully! You will be redirected to the details page shortly.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submission Status */}
                {submissionStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getVerdictIcon(submissionStatus.verdict)}
                        Submission #{submissionStatus.id}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Status:</span>
                          <span className={`font-medium ${
                            submissionStatus.verdict === "AC" ? "text-green-600" :
                            ["WA", "TLE", "MLE", "RTE", "CE"].includes(submissionStatus.verdict) ? "text-red-600" :
                            "text-yellow-600"
                          }`}>
                            {getVerdictText(submissionStatus.verdict)}
                          </span>
                        </div>
                        
                        {submissionStatus.points !== undefined && (
                          <div className="flex justify-between">
                            <span className="font-medium">Points:</span>
                            <span>{submissionStatus.points}/{problem.points}</span>
                          </div>
                        )}
                        
                        {submissionStatus.maxTime !== undefined && submissionStatus.maxTime !== null && (
                          <div className="flex justify-between">
                            <span className="font-medium">Max Time:</span>
                            <span>{submissionStatus.maxTime.toFixed(3)}s</span>
                          </div>
                        )}
                        
                        {submissionStatus.maxMemory !== undefined && submissionStatus.maxMemory !== null && (
                          <div className="flex justify-between">
                            <span className="font-medium">Max Memory:</span>
                            <span>{(submissionStatus.maxMemory / 1024).toFixed(1)}MB</span>
                          </div>
                        )}
                      </div>

                      {/* Test Cases */}
                      {submissionStatus.testCases && submissionStatus.testCases.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Test Cases:</h4>
                          <div className="space-y-1">
                            {submissionStatus.testCases.map((testCase) => (
                              <div key={testCase.id} className="flex items-center justify-between text-sm">
                                <span>Test {testCase.position}:</span>
                                <div className="flex items-center gap-2">
                                  {getVerdictIcon(testCase.verdict)}
                                  <span className={`${
                                    testCase.verdict === "AC" ? "text-green-600" : "text-red-600"
                                  }`}>
                                    {getVerdictText(testCase.verdict)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    ({testCase.time && typeof testCase.time === 'number' ? testCase.time.toFixed(3) : '0.000'}s, {testCase.memory && typeof testCase.memory === 'number' ? formatMemory(testCase.memory) : '0.0MB'})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View Full Submission */}
                      {submissionStatus.id && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/problem/${slug}/submission/${submissionStatus.id}`)}
                          className="w-full"
                        >
                          View Full Submission
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Judge Status Warnings */}
                {judgeStatus && (!judgeStatus.connected || judgeStatus.judgeCount === 0) && (
                  <Alert variant="destructive">
                    <FontAwesomeIcon icon={faServer} className="h-4 w-4" />
                    <AlertDescription>
                      No judges are currently connected. Submissions cannot be processed.
                    </AlertDescription>
                  </Alert>
                )}

                {judgeStatus && judgeStatus.connected && judgeStatus.judgeCount > 0 && !isProblemAvailable && (
                  <Alert variant="destructive">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                    <AlertDescription>
                      This problem is not available on any connected judge. Please try again later.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedLanguage && !isExecutorAvailable(selectedLanguage) && (
                  <Alert variant="destructive">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                    <AlertDescription>
                      The selected language ({selectedLanguage}) is not available on any connected judge.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={
                    isSubmitting || 
                    !selectedLanguage || 
                    !code.trim() || 
                    !isProblemAvailable || 
                    (selectedLanguage ? !isExecutorAvailable(selectedLanguage) : false) ||
                    problem.isLocked
                  }
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : !isProblemAvailable ? (
                    <>
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 mr-2" />
                      Problem Not Available
                    </>
                  ) : selectedLanguage && !isExecutorAvailable(selectedLanguage) ? (
                    <>
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 mr-2" />
                      Language Not Available
                    </>
                  ) : problem.isLocked ? (
                    <>
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 mr-2" />
                      Problem locked
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlay} className="w-4 h-4 mr-2" />
                      Submit Solution
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Problem Info Sidebar */}
        <div className="space-y-4">
          {/* Problem Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faClipboardList} className="w-4 h-4" />
                Problem Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCheck} className="text-primary w-4" />
                <span className="font-medium">Points:</span>
                <span>{problem.points}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-primary w-4" />
                <span className="font-medium">Time Limit:</span>
                <span>{problem.timeLimit}s</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faServer} className="text-primary w-4" />
                <span className="font-medium">Memory Limit:</span>
                <span>{formatMemoryLimit(problem.memoryLimit)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Allowed Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faGlobeAsia} className="w-4 h-4" />
                Allowed Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {languages
                  .filter(lang => 
                    problem.allowedLanguages.includes(lang.value as TAllowedLang) &&
                    lang.value && 
                    lang.value.trim() !== ""
                  )
                  .map((lang) => (
                    <div key={lang.value} className="text-sm flex items-center gap-2">
                      <FontAwesomeIcon 
                        icon={isExecutorAvailable(lang.value) ? faCheck : faTimes} 
                        className={`w-3 h-3 ${isExecutorAvailable(lang.value) ? 'text-green-600' : 'text-red-600'}`} 
                      />
                      <span className={isExecutorAvailable(lang.value) ? '' : 'text-muted-foreground'}>
                        {lang.label}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Judge Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faServer} className="w-4 h-4" />
                Judge Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connected Judges:</span>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon 
                    icon={judgeStatus && judgeStatus.connected && judgeStatus.judgeCount > 0 ? faCheck : faTimes} 
                    className={`w-3 h-3 ${judgeStatus && judgeStatus.connected && judgeStatus.judgeCount > 0 ? 'text-green-600' : 'text-red-600'}`} 
                  />
                  <span className="text-sm">
                    {judgeLoading ? "Loading..." : judgeStatus?.judgeCount || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Problem Available:</span>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon 
                    icon={isProblemAvailable ? faCheck : faTimes} 
                    className={`w-3 h-3 ${isProblemAvailable ? 'text-green-600' : 'text-red-600'}`} 
                  />
                  <span className="text-sm">
                    {isProblemAvailable ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {judgeError && (
                <div className="text-xs text-red-600">
                  Error: {judgeError}
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshCapabilities}
                disabled={judgeLoading}
                className="w-full"
              >
                {judgeLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faServer} className="w-3 h-3 mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Make sure your solution handles all edge cases</p>
              <p>• Test with the provided sample input/output</p>
              <p>• Pay attention to time and memory limits</p>
              <p>• Use efficient algorithms and data structures</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
