"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCheck,
  faPlus,
  faEye,
  faEyeDropper,
  faEyeSlash,
  faLock,
  faMinusCircle,
  faSort,
  faSortUp,
  faSortDown,
  faLockOpen,
  faFilter,
  faEarth,
  faBoltLightning,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IProblemData, ProblemStatus } from "@/lib/server-actions/problems";
import {
  hasPermission,
  UserPermissions as FEUserPermissions,
} from "@/lib/permissions";
import { useAuth } from "@/components/AuthProvider";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

const PROBLEMS_PER_PAGE = 50;

type SortField = "slug" | "name" | "category" | "points" | "acceptance";
type SortOrder = "asc" | "desc" | null;

interface ProblemsPageProps {
  initialProblems: IProblemData[];
  initialCategories: string[];
  initialTypes: {
    value: string;
    label: string;
  }[];
}

function getStatusIcon(status?: ProblemStatus) {
  // handle color
  const result = { icon: faEyeSlash, color: "red" };
  if (!status) return { icon: faEye, color: "red" };
  if (status.solved == true) result.color = "green";
  else if (status.attempted == true) result.color = "yellow";
  // handle icon
  if (status.isLocked && status.isPublic) result.icon = faLockOpen;
  else if (status.isLocked) result.icon = faLock;
  else if (status.isPublic) result.icon = faEye;
  return result;
}

export default function ProblemsPage({
  initialProblems,
  initialCategories,
  initialTypes,
}: ProblemsPageProps) {
  const { sessionToken, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filteredProblems, setFilteredProblems] =
    useState<IProblemData[]>(initialProblems);
  const [searchTerm, setSearchTerm] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [chosenCategory, setChosenCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(
    searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1
  );
  const [showEditorialOnly, setShowEditorialOnly] = useState(false);
  const [hideSolved, setHideSolved] = useState(false);
  const [showTypes, setShowTypes] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Use client session after hydration to avoid SSR mismatch
  const isAuthenticated = isHydrated ? !!sessionToken : false;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: null -> asc -> desc -> null
      if (sortOrder === null) {
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return faSort;
    if (sortOrder === "asc") return faSortUp;
    if (sortOrder === "desc") return faSortDown;
    return faSort;
  };

  const sortProblems = useCallback(
    (problems: IProblemData[]) => {
      if (!sortField || !sortOrder) return problems;

      return [...problems].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case "slug":
            aValue = a.code;
            bValue = b.code;
            break;
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "category":
            aValue = a.category.toLowerCase();
            bValue = b.category.toLowerCase();
            break;
          case "points":
            aValue = a.points;
            bValue = b.points;
            break;
          case "acceptance":
            // Handle acceptance rate with special case for null/undefined stats
            const aRate = a.stats
              ? a.stats.submissions === 0
                ? -1
                : (a.stats.ACSubmissions / a.stats.submissions) * 100
              : -1;
            const bRate = b.stats
              ? b.stats.submissions === 0
                ? -1
                : (b.stats.ACSubmissions / b.stats.submissions) * 100
              : -1;
            aValue = aRate;
            bValue = bRate;
            break;
          default:
            return 0;
        }

        // Handle string comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue);
          return sortOrder === "asc" ? comparison : -comparison;
        }

        // Handle numeric comparison (including acceptance rate)
        if (typeof aValue === "number" && typeof bValue === "number") {
          // For acceptance rate, put -1 (no data) values at the end regardless of sort order
          if (sortField === "acceptance") {
            if (aValue === -1 && bValue === -1) return 0;
            if (aValue === -1) return 1; // a goes to end
            if (bValue === -1) return -1; // b goes to end
          }

          const comparison = aValue - bValue;
          return sortOrder === "asc" ? comparison : -comparison;
        }

        return 0;
      });
    },
    [sortField, sortOrder]
  );

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
          problem.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Editorial filter
    if (showEditorialOnly) {
      filtered = filtered.filter((problem) => problem.solution);
    }

    // Hide solved problems filter
    if (hideSolved && isAuthenticated) {
      filtered = filtered.filter((problem) => !problem.status?.solved);
    }

    // Category filter
    if (chosenCategory != "") {
      filtered = filtered.filter(
        (problem) =>
          problem.category.toLowerCase() === chosenCategory.toLowerCase()
      );
    }

    // Types filter
    if (types.length > 0) {
      filtered = filtered.filter((problem) =>
        problem.type.some((type) => types.includes(type))
      );
    }

    // Apply sorting
    filtered = sortProblems(filtered);

    setFilteredProblems(filtered);
  }, [
    searchTerm,
    initialProblems,
    showEditorialOnly,
    hideSolved,
    isAuthenticated,
    sortField,
    sortOrder,
    sortProblems,
    currentPage,
    totalPages,
    chosenCategory,
    types,
  ]);

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

  const handleRandomProblem = () => {
    if (filteredProblems.length === 0) return;

    // Get a random problem from the filtered list
    const randomIndex = Math.floor(Math.random() * filteredProblems.length);
    const randomProblem = filteredProblems[randomIndex];

    // Open in new tab
    window.open(`/problem/${randomProblem.code}`, "_blank");
  };

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-3xl font-bold">Problems list</h1>
          {isAuthenticated &&
            hasPermission(
              user?.perms,
              FEUserPermissions.CREATE_NEW_PROBLEM
            ) && (
              <div className="ml-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="ml-2 hover:cursor-pointer" variant="outline">
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      New
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="center">
                    <DropdownMenuItem onClick={() => router.push('/problems/create')} className="hover:cursor-pointer">
                      <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
                      Create a new problem
                    </DropdownMenuItem>
                    <DropdownMenuLabel>Import from</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => router.push('/problems/import/dmoj')} className="hover:cursor-pointer">
                        <FontAwesomeIcon icon={faEarth} className="mr-2" />
                        DMOJ site
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/problems/import/codeforces')} className="hover:cursor-pointer">
                        <FontAwesomeIcon icon={faBoltLightning} className="mr-2" />
                        Codeforces
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
        </div>
        <hr className="mb-6" />
        {/* Filters */}
        <Card className="mb-8 rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-5 border-b">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <FontAwesomeIcon
                  icon={faFilter}
                  className="w-5 h-5 text-primary"
                />
                Filters
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Refine your search by name, category, type, or editorial
                availability
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Top Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Search */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="search" className="text-sm font-medium">
                  Search
                </Label>
                <div className="relative flex-1">
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search problems by name or slug"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(e) => setChosenCategory(e)}
                    value={chosenCategory}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {initialCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {chosenCategory && (
                    <Button
                      variant={"outline"}
                      onClick={() => setChosenCategory("")}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Types */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="types" className="text-sm font-medium">
                  Types
                </Label>
                <MultiSelect
                  id="types"
                  placeholder="Select problem types"
                  options={initialTypes}
                  onValueChange={setTypes}
                  defaultValue={types}
                  hideSelectAll
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Show problems with editorial only
                </span>
                <button
                  type="button"
                  onClick={() => setShowEditorialOnly(!showEditorialOnly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showEditorialOnly ? "bg-primary" : "bg-muted"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showEditorialOnly ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {isAuthenticated && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Hide solved problems
                  </span>
                  <button
                    type="button"
                    onClick={() => setHideSolved(!hideSolved)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hideSolved ? "bg-primary" : "bg-muted"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideSolved ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Show problem types</span>
                <button
                  type="button"
                  onClick={() => setShowTypes(!showTypes)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showTypes ? "bg-primary" : "bg-muted"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showTypes ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Random Problem Button */}
            <div className="border-t pt-4">
              <Button
                onClick={handleRandomProblem}
                disabled={filteredProblems.length === 0}
                className="w-full"
                variant="outline"
              >
                🎲 Random Problem
                {filteredProblems.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (from {filteredProblems.length} result
                    {filteredProblems.length != 1 ? "s" : ""})
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
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
                    style={{
                      width: "2.5rem",
                      minWidth: "2.5rem",
                      maxWidth: "2.5rem",
                      paddingLeft: "0.5rem",
                      paddingRight: "0.5rem",
                    }}
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
                <th
                  className={`h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 ${!isAuthenticated ? "first:rounded-tl-md" : ""
                    } cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100`}
                  onClick={() => handleSort("slug")}
                >
                  <div className="flex items-center gap-2">
                    Slug
                    <FontAwesomeIcon
                      icon={getSortIcon("slug")}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Problem
                    <FontAwesomeIcon
                      icon={getSortIcon("name")}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 min-w-[200px] border-r border-gray-600 dark:border-gray-300 cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center gap-2">
                    Category
                    <FontAwesomeIcon
                      icon={getSortIcon("category")}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                {showTypes && (
                  <th className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 min-w-[150px] border-r border-gray-600 dark:border-gray-300">
                    Types
                  </th>
                )}
                <th
                  className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 w-[4.5rem] cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100"
                  onClick={() => handleSort("points")}
                >
                  <div className="flex items-center gap-2">
                    Points
                    <FontAwesomeIcon
                      icon={getSortIcon("points")}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  className="h-12 px-4 text-left align-middle font-medium text-white dark:text-gray-900 border-r border-gray-600 dark:border-gray-300 w-16 cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100"
                  onClick={() => handleSort("acceptance")}
                >
                  <div className="flex items-center gap-2">
                    %AC
                    <FontAwesomeIcon
                      icon={getSortIcon("acceptance")}
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
                      6 + // Slug, Problem, Category, Points, %AC, Editorial
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
                    className={`border-b transition-colors ${problem.isDeleted // The problem is deleted
                      ? "bg-muted/100 opacity-50 pointer-events-none"
                      : "hover:bg-muted/50"
                      }`}
                  >
                    {isAuthenticated && (
                      <td
                        className="p-4 align-middle border-r border-border"
                        style={{
                          width: "2.5rem",
                          minWidth: "2.5rem",
                          maxWidth: "2.5rem",
                          paddingLeft: "0.5rem",
                          paddingRight: "0.5rem",
                        }}
                      >
                        <span className="flex items-center justify-center h-full w-full">
                          <FontAwesomeIcon
                            icon={getStatusIcon(problem.status).icon}
                            className={`w-4 h-4 text-${getStatusIcon(problem.status).color
                              }-600 dark:text-${getStatusIcon(problem.status).color
                              }-400`}
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
                        className={`font-medium ${!problem.stats
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
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span>Page</span>
            <Input
              type="text"
              className="w-16 text-center"
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
            />
            <span>of {totalPages}</span>
          </div>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Additional Info */}
      {currentProblems.length > 0 && (
        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            Click on a problem slug or name to view the full problem statement.
          </p>
        </div>
      )}
    </main>
  );
}
