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
import { faArrowLeft, faSearch, faFilter } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/AuthProvider";

interface Submission {
  id: number;
  authorId: number;
  problemId: number;
  language: string;
  verdict: string;
  score: number;
  time: number;
  memory: number;
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

export default function SubmissionsPage() {
  const { isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter states
  const [problemFilter, setProblemFilter] = useState(searchParams.get("problemCode") || "");
  const [authorFilter, setAuthorFilter] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("");

  const problemCode = searchParams.get("problemCode");
  const authorParam = searchParams.get("author");
  const isMySubmissions = authorParam === "me";

  const verdictColors: { [key: string]: string } = {
    AC: "bg-green-100 text-green-800 border-green-300",
    WA: "bg-red-100 text-red-800 border-red-300",
    TLE: "bg-yellow-100 text-yellow-800 border-yellow-300",
    MLE: "bg-purple-100 text-purple-800 border-purple-300",
    RE: "bg-orange-100 text-orange-800 border-orange-300",
    QU: "bg-blue-100 text-blue-800 border-blue-300",
    JU: "bg-gray-100 text-gray-800 border-gray-300",
    SK: "bg-gray-100 text-gray-600 border-gray-300",
  };

  const verdictNames: { [key: string]: string } = {
    AC: "Accepted",
    WA: "Wrong Answer",
    TLE: "Time Limit Exceeded",
    MLE: "Memory Limit Exceeded",
    RE: "Runtime Error",
    QU: "Queued",
    JU: "Judging",
    SK: "Skipped",
  };

  const fetchSubmissions = React.useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (problemFilter) params.append("problemCode", problemFilter);
      if (isMySubmissions && user?.username) {
        params.append("author", user.username);
      } else if (authorFilter) {
        params.append("author", authorFilter);
      }
      if (verdictFilter && verdictFilter !== "all") params.append("verdict", verdictFilter);

      const response = await fetch(`/api/submissions?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const result: SubmissionsResponse = await response.json();
      setSubmissions(result.data || []);
      setTotalPages(result.pagination?.totalPages || 0);
      setCurrentPage(result.pagination?.page || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [problemFilter, authorFilter, verdictFilter, isMySubmissions, user?.username]);

  useEffect(() => {
    if (isMySubmissions && !isAuthenticated) {
      setError("Please log in to view your submissions");
      setLoading(false);
      return;
    }
    
    // Set initial filters from URL params
    if (problemCode) setProblemFilter(problemCode);
    if (isMySubmissions) setAuthorFilter("");
    
    fetchSubmissions(1);
  }, [problemCode, isMySubmissions, isAuthenticated, user, fetchSubmissions]);

  const handleSearch = () => {
    fetchSubmissions(1);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
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
  };  const getPageTitle = () => {
    if (problemCode && isMySubmissions) {
      return `My Submissions for Problem ${problemCode}`;
    } else if (problemCode) {
      return `All Submissions for Problem ${problemCode}`;
    } else if (isMySubmissions) {
      return "My Submissions";
    }
    return "All Submissions";
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            {!isAuthenticated && isMySubmissions && (
              <Button asChild>
                <Link href="/accounts/login">Login</Link>
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
        <div className="flex items-center gap-4 mb-6">
          {problemCode && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/problem/${problemCode}`}>
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                Back to Problem
              </Link>
            </Button>
          )}
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="problem">Problem</Label>
                <Input
                  id="problem"
                  placeholder="Problem code"
                  value={problemFilter}
                  onChange={(e) => setProblemFilter(e.target.value)}
                />
              </div>
              {!isMySubmissions && (
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="Username"
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="verdict">Verdict</Label>
                <Select value={verdictFilter} onValueChange={setVerdictFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All verdicts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All verdicts</SelectItem>
                    <SelectItem value="AC">Accepted</SelectItem>
                    <SelectItem value="WA">Wrong Answer</SelectItem>
                    <SelectItem value="TLE">Time Limit Exceeded</SelectItem>
                    <SelectItem value="MLE">Memory Limit Exceeded</SelectItem>
                    <SelectItem value="RE">Runtime Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full">
                  <FontAwesomeIcon icon={faSearch} className="w-4 h-4 mr-2" />
                  Search
                </Button>
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
            ) : !submissions || submissions.length === 0 ? (
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
                    {submissions && submissions.map((submission) => (
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
                        <td className="p-4">{submission.score}/{submission.problem.points}</td>
                        <td className="p-4 font-mono text-sm">
                          {submission.time ? formatTime(submission.time) : "-"}
                        </td>
                        <td className="p-4 font-mono text-sm">
                          {submission.memory ? formatMemory(submission.memory) : "-"}
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
              onClick={() => fetchSubmissions(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => fetchSubmissions(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
