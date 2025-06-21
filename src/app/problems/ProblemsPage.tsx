"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faCheck, faMinusCircle, faSearch } from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { IProblemData } from "@/types";
import Loading from "../loading";

const PROBLEMS_PER_PAGE = 50;

export default function ProblemsPage() {
  const [problems, setProblems] = useState<IProblemData[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<IProblemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditorialOnly, setShowEditorialOnly] = useState(false);
  const [showTypes, setShowTypes] = useState(false);

  const totalPages = Math.ceil(filteredProblems.length / PROBLEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE;
  const endIndex = startIndex + PROBLEMS_PER_PAGE;
  const currentProblems = filteredProblems.slice(startIndex, endIndex);

  useEffect(() => {
    fetch(new URL("/client/problems/all", process.env.NEXT_PUBLIC_API_ENDPOINT!).toString())
      .then((res) => res.json())
      .then((data) => {
        setProblems(data);
        setFilteredProblems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching problems:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = problems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((problem) =>
        problem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Editorial filter
    if (showEditorialOnly) {
      filtered = filtered.filter((problem) =>
        problem.solution && problem.solution.trim() !== ""
      );
    }

    setFilteredProblems(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, problems, showEditorialOnly]);

  const calculateAcceptanceRate = (stats: IProblemData['stats']) => {
    return (stats.ACSumissions / stats.submissions) * 100;
  };

  const formatAcceptanceRate = (stats: IProblemData['stats']) => {
    return calculateAcceptanceRate(stats).toFixed(1);
  };

  const getCategoryDisplay = (categories: string[]) => {
    if (categories.length === 0) return "-";
    return categories.join(", ");
  };

  const getTypeDisplay = (types: string[]) => {
    if (types.length === 0) return "-";
    return types.join(", ");
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Problems list</h1>
        <hr className="mb-6" />
        {/* Search Box */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-md">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
            />
            <Input
              type="text"
              placeholder="Search problems by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showEditorialOnly}
              onChange={(e) => setShowEditorialOnly(e.target.checked)}
              className="rounded border border-input bg-background"
            />
            <span className="text-foreground">Show problems with editorial only</span>
          </label>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTypes(!showTypes)}
            className="text-sm"
          >
            {showTypes ? "Hide" : "Show"} problem types
          </Button>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {totalPages > 1 && (
            <> • Page {currentPage} of {totalPages}</>
          )}
        </div>
      </div>

      {/* Problems Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-800 dark:bg-white">
                <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 first:rounded-tl-md">ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300">Problem</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 min-w-[200px] border-r border-gray-600 dark:border-gray-300">Category</th>
                {showTypes && (
                  <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 min-w-[150px] border-r border-gray-600 dark:border-gray-300">Types</th>
                )}
                <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 w-[4.5rem]">Points</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 w-16">%AC</th>
                <th className={`h-12 px-4 text-center align-middle font-medium text-white dark:text-gray-900 w-16 rounded-tr-md`}>
                  <FontAwesomeIcon icon={faBook} className="w-4 h-4" title="Editorial" />
                </th>
              </tr>
            </thead>
            <tbody>
              {currentProblems.length === 0 ? (
                <tr>
                  <td colSpan={showTypes ? 7 : 6} className="h-24 px-4 text-center text-muted-foreground">
                    {searchTerm ? "No problems found matching your search." : "No problems available."}
                  </td>
                </tr>
              ) : (
                currentProblems.map((problem) => (
                  <tr key={problem.code} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle border-r border-border">
                      <Link 
                        href={`/problem/${problem.code}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {problem.code}
                      </Link>
                    </td>
                    <td className="p-4 align-middle border-r border-border">
                      <Link 
                        href={`/problem/${problem.code}`}
                        className="text-primary hover:underline font-medium break-words"
                      >
                        {problem.name}
                      </Link>
                    </td>
                    <td className="p-4 align-top text-sm min-w-[200px] border-r border-border">
                      <span className="text-foreground break-words whitespace-normal">
                        {getCategoryDisplay(problem.category)}
                      </span>
                    </td>
                    {showTypes && (
                      <td className="p-4 align-top text-sm min-w-[150px] border-r border-border">
                        <span className="text-foreground break-words whitespace-normal">
                          {getTypeDisplay(problem.type)}
                        </span>
                      </td>
                    )}
                    <td className="p-4 align-middle text-center border-r border-border w-[4.5rem]">
                      <span className="text-foreground">{problem.points}</span>
                    </td>
                    <td className="p-4 align-middle text-center border-r border-border w-16">
                      <span className={`font-medium ${
                        !problem.stats 
                          ? 'text-muted-foreground'
                          : calculateAcceptanceRate(problem.stats) >= 50 
                          ? 'text-green-600 dark:text-green-400' 
                          : calculateAcceptanceRate(problem.stats) >= 25
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {problem.stats ? formatAcceptanceRate(problem.stats) : "N/A"}%
                      </span>
                    </td>
                    <td className="p-4 align-middle text-center w-16">
                      {problem.solution && problem.solution.trim() !== "" ? (
                        <FontAwesomeIcon 
                          icon={faCheck} 
                          className="w-4 h-4 text-green-600 dark:text-green-400" 
                          title="Editorial available"
                        />
                      ) : (
                        <FontAwesomeIcon 
                          icon={faMinusCircle} 
                          className="w-4 h-4 text-red-600 dark:text-red-400" 
                          title="No editorial available"
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 7) {
                  pageNumber = i + 1;
                } else if (currentPage <= 4) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNumber = totalPages - 6 + i;
                } else {
                  pageNumber = currentPage - 3 + i;
                }
                
                if (pageNumber === currentPage - 2 && currentPage > 4 && totalPages > 7) {
                  return (
                    <PaginationItem key="ellipsis-start">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                if (pageNumber === currentPage + 2 && currentPage < totalPages - 3 && totalPages > 7) {
                  return (
                    <PaginationItem key="ellipsis-end">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={pageNumber === currentPage}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Additional Info */}
      {currentProblems.length > 0 && (
        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            Click on a problem ID or name to view the full problem statement.
          </p>
        </div>
      )}
    </main>
  );
}