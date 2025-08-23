"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFilter, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/AuthProvider";
import { Metadata } from "next";
import { Config } from "@/config";

interface Submission {
  id: number;
  authorId: number;
  language: string;
  verdict: string;
  points: number;
  maxTime: number;
  maxMemory: number;
  createdAt: string;
  author: {
    username: string;
    fullname: string;
  };
  problem: {
    slug: string;
    name: string;
    points: number;
  };
}

interface SubmissionsResponse {
  success: boolean;
  data: Submission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Submission list - ${Config.siteDescription}`,
    description: `View public submissions of ${Config.sitename}`,
  };
}

export default function SubmissionsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMySubmissions = typeof searchParams.get("mySubmissions") == "string";

  // Filter states - Initialize from URL params immediately
  const [problemFilter, setProblemFilter] = useState(searchParams.get("problemSlug") || "");
  const [authorFilter, setAuthorFilter] = useState(
    searchParams.get("author") || ""
  );
  const [verdictFilter, setVerdictFilter] = useState("");
  const [isPolling, setIsPolling] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const problemSlug = searchParams.get("problemSlug");
  console.log(typeof searchParams.get("mySubmissions") == "string")

  const verdictColors: { [key: string]: string } = {
    AC: "bg-green-100 text-green-800 border-green-300",
    WA: "bg-red-100 text-red-800 border-red-300",
    TLE: "bg-yellow-100 text-yellow-800 border-yellow-300",
    MLE: "bg-purple-100 text-purple-800 border-purple-300",
    RTE: "bg-orange-100 text-orange-800 border-orange-300",
    CE: "bg-pink-100 text-pink-800 border-pink-300",
    QU: "bg-blue-100 text-blue-800 border-blue-300",
    RN: "bg-blue-100 text-blue-800 border-blue-300",
    AB: "bg-gray-100 text-gray-800 border-gray-300",
    IR: "bg-yellow-100 text-yellow-800 border-yellow-300",
    OLE: "bg-yellow-100 text-yellow-800 border-yellow-300",
    ISE: "bg-red-100 text-red-800 border-red-300",
    SK: "bg-gray-100 text-gray-600 border-gray-300",
  };

  const verdictNames: { [key: string]: string } = {
    AC: "Accepted",
    WA: "Wrong Answer",
    TLE: "Time Limit Exceeded",
    MLE: "Memory Limit Exceeded",
    RTE: "Runtime Error",
    CE: "Compilation Error",
    QU: "Queued",
    RN: "Running",
    AB: "Aborted",
    IR: "Invalid Return",
    OLE: "Output Limit Exceeded",
    ISE: "Internal Server Error",
    SK: "Skipped",
  };

  const fetchSubmissions = React.useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);

      // Fetch submissions in batches since API limits to 100 per request
      let allSubs: Submission[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) { // Limit to 10 pages (1000 submissions max)
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "100", // Maximum allowed by API
        });

        const url = `/api/submissions?${params}`;
        console.log(`Fetching submissions page ${page} from:`, url);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch submissions (page ${page}): ${response.status} ${response.statusText}`);
        }

        const result: SubmissionsResponse = await response.json();
        const pageData = result.data || [];

        allSubs = [...allSubs, ...pageData];

        // Check if we have more pages
        hasMore = pageData.length === 100 && page < (result.pagination?.totalPages || 0);
        page++;
      }

      console.log(`Fetched ${allSubs.length} total submissions`);
      setAllSubmissions(allSubs);
      setError(null);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      if (!silent) setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Client-side filtering logic
  const filteredSubmissions = React.useMemo(() => {
    let filtered = allSubmissions;

    // Problem filter
    if (problemFilter.trim()) {
      filtered = filtered.filter(sub =>
        sub.problem.slug.toLowerCase().includes(problemFilter.toLowerCase()) ||
        sub.problem.name.toLowerCase().includes(problemFilter.toLowerCase())
      );
    }

    // Author filter
    if (authorFilter.trim()) {
      filtered = filtered.filter(sub =>
        sub.author?.username?.toLowerCase().includes(authorFilter.toLowerCase())
      );
    }

    // Verdict filter
    if (verdictFilter && verdictFilter !== "all") {
      filtered = filtered.filter(sub => sub.verdict === verdictFilter);
    }

    return filtered;
  }, [allSubmissions, problemFilter, authorFilter, verdictFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Separate effect to handle setting username when "me" is used
  useEffect(() => {
    if (isMySubmissions && user?.username && !authorFilter) {
      setAuthorFilter(user.username);
    }
  }, [isMySubmissions, user?.username, authorFilter]);

  // Main effect to fetch submissions
  useEffect(() => {
    // Don't fetch if we're waiting for auth and need user info for "me" filter
    if (isMySubmissions && authLoading) {
      return;
    }

    if (isMySubmissions && !isAuthenticated) {
      setError("Please log in to view your submissions");
      setLoading(false);
      return;
    }

    fetchSubmissions();
  }, [isAuthenticated, authLoading, fetchSubmissions, isMySubmissions]);

  // Polling effect - refresh submissions every 3 seconds
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      fetchSubmissions(true); // Silent update during polling
    }, 3000);

    return () => clearInterval(interval);
  }, [isPolling, fetchSubmissions]);

  // On filter change - set current page to 1
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [problemFilter, authorFilter, verdictFilter, currentPage, totalPages]);

  const formatTime = (s: number) => {
    return `${s.toFixed(2)}s`;
  };

  const formatMemory = (kb: number): string => {
    return `${(kb / 1024).toFixed(1)}MB`;
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
  }; const getPageTitle = () => {
    if (problemSlug && isMySubmissions) {
      return `My Submissions for Problem ${problemSlug}`;
    } else if (problemSlug) {
      return `All Submissions for Problem ${problemSlug}`;
    } else if (isMySubmissions) {
      return "My Submissions";
    }
    return "All Submissions";
  };

  if (isMySubmissions && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            {!isAuthenticated && isMySubmissions && (
              <Button asChild>
                <Link href={`/accounts/login?callbackUrl=${encodeURIComponent('/submissions?mySubmissions')}`}>Login</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {problemSlug && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/problem/${problemSlug}`}>
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                  Back to Problem
                </Link>
              </Button>
            )}
            <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPolling(!isPolling)}
              className={isPolling ? "bg-green-50 border-green-300" : ""}
            >
              <FontAwesomeIcon icon={isPolling ? faPause : faPlay} className="w-4 h-4 mr-2" />
              {isPolling ? "Pause Auto-refresh" : "Start Auto-refresh"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {isPolling ? "Refreshing every 3 seconds" : "Auto-refresh paused"}
            </span>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-sm rounded-2xl border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FontAwesomeIcon icon={faFilter} className="w-4 h-4" />
              Filters
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Narrow down your search by problem, author, or verdict
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Problem Filter */}
              <div className="flex flex-col">
                <Label htmlFor="problem" className="mb-2 text-sm font-medium">
                  Problem
                </Label>
                <Input
                  id="problem"
                  placeholder="Enter problem name or slug"
                  value={problemFilter}
                  onChange={(e) => setProblemFilter(e.target.value)}
                  className="rounded-md"
                />
              </div>

              {/* Author Filter */}
              <div className="flex flex-col">
                <Label htmlFor="author" className="mb-2 text-sm font-medium">
                  Author
                </Label>
                <Input
                  id="author"
                  placeholder="Username"
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  readOnly={isMySubmissions}
                  className={`rounded-md ${isMySubmissions ? "bg-muted text-muted-foreground cursor-not-allowed" : ""
                    }`}
                />
                {isMySubmissions && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing only your submissions
                  </p>
                )}
              </div>

              {/* Verdict Filter */}
              <div className="flex flex-col">
                <Label htmlFor="verdict" className="mb-2 text-sm font-medium">
                  Verdict
                </Label>
                <Select value={verdictFilter} onValueChange={setVerdictFilter}>
                  <SelectTrigger className="rounded-md">
                    <SelectValue placeholder="Select a verdict" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All verdicts</SelectItem>
                    <SelectItem value="AC">Accepted</SelectItem>
                    <SelectItem value="WA">Wrong Answer</SelectItem>
                    <SelectItem value="TLE">Time Limit Exceeded</SelectItem>
                    <SelectItem value="MLE">Memory Limit Exceeded</SelectItem>
                    <SelectItem value="RTE">Runtime Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Loading submissions...</p>
              </div>
            ) : !paginatedSubmissions || paginatedSubmissions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No submissions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">ID</th>
                      <th className="p-4 font-medium">Problem</th>
                      <th className="p-4 font-medium">Author</th>
                      <th className="p-4 font-medium">Language</th>
                      <th className="p-4 font-medium">Verdict</th>
                      <th className="p-4 font-medium">Score</th>
                      <th className="p-4 font-medium">Time</th>
                      <th className="p-4 font-medium">Memory</th>
                      <th className="p-4 font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubmissions.map((submission) => (
                      <tr key={submission.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <Link
                            href={`/problem/${submission.problem.slug}/submission/${submission.id}`}
                            className="text-primary hover:underline font-mono"
                          >
                            {submission.id}
                          </Link>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/problem/${submission.problem.slug}`}
                            className="text-primary hover:underline"
                          >
                            {submission.problem.name}
                          </Link>
                        </td>
                        <td className="p-4">
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
                        </td>
                        <td className="p-4 font-mono text-sm">{submission.language}</td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={verdictColors[submission.verdict] || ""}
                          >
                            {verdictNames[submission.verdict] || submission.verdict}
                          </Badge>
                        </td>
                        <td className="p-4">{submission.points}/{submission.problem.points}</td>
                        <td className="p-4 font-mono text-sm">
                          {submission.maxTime ? formatTime(submission.maxTime) : "-"}
                        </td>
                        <td className="p-4 font-mono text-sm">
                          {submission.maxMemory ? formatMemory(submission.maxMemory) : "-"}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(submission.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
