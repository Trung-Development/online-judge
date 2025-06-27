"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCheck,
  faEye,
  faEyeDropper,
  faEyeSlash,
  faLock,
  faMinusCircle,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
  faLockOpen,
} from "@fortawesome/free-solid-svg-icons";
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
import Loading from "../loading";
import { IProblemData, ProblemStatus } from "@/lib/server-actions/problems";
import { useSession } from "next-auth/react";

const PROBLEMS_PER_PAGE = 50;

type SortField = 'id' | 'name' | 'category' | 'points' | 'acceptance';
type SortOrder = 'asc' | 'desc' | null;

interface ProblemsPageProps {
  initialProblems: IProblemData[];
}

function getStatusIcon(status?: ProblemStatus) {
  // handle color
  const result = {icon: faEyeSlash, color: 'red'};
  if(!status) return { icon: faEye, color: 'red' };
  if(status.solved == true) result.color = 'green';
  else if(status.attempted == true) result.color = 'yellow';
  // handle icon
  if(status.isLocked && status.isPublic) result.icon = faLockOpen;
  else if(status.isLocked) result.icon = faLock;
  else if(status.isPublic) result.icon = faEye;
  return result;
}

export default function ProblemsPage({ initialProblems }: ProblemsPageProps) {
  const { data: clientSession } = useSession();
  const [filteredProblems, setFilteredProblems] = useState<IProblemData[]>(initialProblems);
  const [loading] = useState(false); // No longer loading since we have initial data
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditorialOnly, setShowEditorialOnly] = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Use client session after hydration to avoid SSR mismatch
  const isAuthenticated = isHydrated ? !!clientSession?.sessionToken : false;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: null -> asc -> desc -> null
      if (sortOrder === null) {
        setSortOrder('asc');
      } else if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return faSort;
    if (sortOrder === 'asc') return faSortUp;
    if (sortOrder === 'desc') return faSortDown;
    return faSort;
  };

  const sortProblems = useCallback((problems: IProblemData[]) => {
    if (!sortField || !sortOrder) return problems;

    return [...problems].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'id':
          aValue = a.code;
          bValue = b.code;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'points':
          aValue = a.points;
          bValue = b.points;
          break;
        case 'acceptance':
          // Handle acceptance rate with special case for null/undefined stats
          const aRate = a.stats ? (a.stats.submissions === 0 ? -1 : (a.stats.ACSubmissions / a.stats.submissions) * 100) : -1;
          const bRate = b.stats ? (b.stats.submissions === 0 ? -1 : (b.stats.ACSubmissions / b.stats.submissions) * 100) : -1;
          aValue = aRate;
          bValue = bRate;
          break;
        default:
          return 0;
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Handle numeric comparison (including acceptance rate)
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        // For acceptance rate, put -1 (no data) values at the end regardless of sort order
        if (sortField === 'acceptance') {
          if (aValue === -1 && bValue === -1) return 0;
          if (aValue === -1) return 1; // a goes to end
          if (bValue === -1) return -1; // b goes to end
        }
        
        const comparison = aValue - bValue;
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }, [sortField, sortOrder]);

  const totalPages = Math.ceil(filteredProblems.length / PROBLEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE;
  const endIndex = startIndex + PROBLEMS_PER_PAGE;
  const currentProblems = filteredProblems.slice(startIndex, endIndex);

  useEffect(() => {
    let filtered = initialProblems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (problem) =>
          problem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          problem.code.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Editorial filter
    if (showEditorialOnly) {
      filtered = filtered.filter(
        (problem) => problem.solution,
      );
    }

    // Apply sorting
    filtered = sortProblems(filtered);

    setFilteredProblems(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, initialProblems, showEditorialOnly, sortField, sortOrder, sortProblems]);

  const calculateAcceptanceRate = (stats: IProblemData["stats"]) => {
    if (stats.submissions === 0) return null;
    return (stats.ACSubmissions / stats.submissions) * 100;
  };

  const formatAcceptanceRate = (stats: IProblemData["stats"]) => {
    const rate = calculateAcceptanceRate(stats);
    if (rate === null) return "-";
    return rate.toFixed(1);
  };

  const getTypeDisplay = (types: string[]) => {
    if (types.length === 0) return "-";
    return types.join(", ");
  };

  if (loading) {
    return <Loading />;
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
            <Button variant="outline" onClick={() => setSearchTerm("")}>
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
            <span className="text-foreground">
              Show problems with editorial only
            </span>
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
            <>
              {" "}
              • Page {currentPage} of {totalPages}
            </>
          )}
        </div>
      </div>

      {/* Problems Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-800 dark:bg-white">
                {isAuthenticated && (
                  <th
                    className="h-12 px-4 text-center align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 first:rounded-tl-md"
                    style={{ width: "2.5rem", minWidth: "2.5rem", maxWidth: "2.5rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}
                  >
                    <span className="flex items-center justify-center h-full">
                      <FontAwesomeIcon
                        icon={faEyeDropper}
                        aria-label="Status"
                        className="w-4 h-4"
                        title="Status"
                      />
                    </span>
                  </th>
                )}
                <th className={`h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 ${!isAuthenticated ? 'first:rounded-tl-md' : ''} cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100`}
                    onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-2">
                    ID
                    <FontAwesomeIcon
                      icon={getSortIcon('id')}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100"
                    onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">
                    Problem
                    <FontAwesomeIcon
                      icon={getSortIcon('name')}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 min-w-[200px] border-r border-gray-600 dark:border-gray-300 cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100"
                    onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-2">
                    Category
                    <FontAwesomeIcon
                      icon={getSortIcon('category')}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                {showTypes && (
                  <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 min-w-[150px] border-r border-gray-600 dark:border-gray-300">
                    Types
                  </th>
                )}
                <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 w-[4.5rem] cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100"
                    onClick={() => handleSort('points')}>
                  <div className="flex items-center gap-2">
                    Points
                    <FontAwesomeIcon
                      icon={getSortIcon('points')}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 w-16 cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100"
                    onClick={() => handleSort('acceptance')}>
                  <div className="flex items-center gap-2">
                    %AC
                    <FontAwesomeIcon
                      icon={getSortIcon('acceptance')}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  className={`h-12 px-4 text-center align-middle font-medium text-white dark:text-gray-900 w-16 rounded-tr-md`}
                >
                  <FontAwesomeIcon
                    icon={faBook}
                    className="w-4 h-4"
                    title="Editorial"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {currentProblems.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      (isAuthenticated ? 1 : 0) + // status column
                      6 + // ID, Problem, Category, Points, %AC, Editorial
                      (showTypes ? 1 : 0) // types column
                    }
                    className="h-24 px-4 text-center text-muted-foreground"
                  >
                    {searchTerm
                      ? "No problems found matching your search."
                      : "No problems available."}
                  </td>
                </tr>
              ) : (
                currentProblems.map((problem) => (
                  <tr
                    key={problem.code}
                    className={`border-b transition-colors ${problem.isDeleted ? 'bg-muted/100 opacity-50 pointer-events-none' : 'hover:bg-muted/50'}`}
                  >
                    {isAuthenticated && (
                      <td
                        className="p-4 align-middle border-r border-border"
                        style={{ width: "2.5rem", minWidth: "2.5rem", maxWidth: "2.5rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}
                      >
                        <span className="flex items-center justify-center h-full w-full">
                          <FontAwesomeIcon
                            icon={getStatusIcon(problem.status).icon}
                            className={`w-4 h-4 text-${getStatusIcon(problem.status).color}-600 dark:text-${getStatusIcon(problem.status).color}-400`}
                          />
                        </span>
                      </td>
                    )}
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
                    <td className="p-4 align-middle text-sm min-w-[200px] border-r border-border">
                      <span className="text-foreground break-words whitespace-normal">
                        {problem.category}
                      </span>
                    </td>
                    {showTypes && (
                      <td className="p-4 align-middle text-sm min-w-[150px] border-r border-border">
                        <span className="text-foreground break-words whitespace-normal">
                          {getTypeDisplay(problem.type)}
                        </span>
                      </td>
                    )}
                    <td className="p-4 align-middle text-center border-r border-border w-[4.5rem]">
                      <span className="text-foreground">{problem.points}</span>
                    </td>
                    <td className="p-4 align-middle text-center border-r border-border w-16">
                      <span
                        className={`font-medium ${
                          !problem.stats
                            ? "text-muted-foreground"
                            : calculateAcceptanceRate(problem.stats) === null
                              ? "text-muted-foreground"
                              : calculateAcceptanceRate(problem.stats)! >= 50
                                ? "text-green-600 dark:text-green-400"
                                : calculateAcceptanceRate(problem.stats)! >= 25
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {problem.stats
                          ? formatAcceptanceRate(problem.stats)
                          : "N/A"}
                        {formatAcceptanceRate(problem.stats) !== "-" && "%"}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-center w-16">
                      {problem.solution ? (
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
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

                if (
                  pageNumber === currentPage - 2 &&
                  currentPage > 4 &&
                  totalPages > 7
                ) {
                  return (
                    <PaginationItem key="ellipsis-start">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                if (
                  pageNumber === currentPage + 2 &&
                  currentPage < totalPages - 3 &&
                  totalPages > 7
                ) {
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
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
