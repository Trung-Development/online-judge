"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
  faTrophy,
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
import { IUsersListData } from "@/lib/server-actions/users";
import { getRatingClass, getRatingTitle } from "@/lib/rating";
import RatingDisplay from "@/components/RatingDisplay";
import "@/styles/rating.css";
import "@/styles/table.css";

const USERS_PER_PAGE = 50;

type SortField = "username" | "rating" | "points" | "problems";
type SortOrder = "asc" | "desc" | null;

interface UsersPageProps {
  initialUsers: IUsersListData[];
}

export default function UsersPage({ initialUsers }: UsersPageProps) {
  const [filteredUsers, setFilteredUsers] = useState<IUsersListData[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("points");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return faSort;
    if (sortOrder === "asc") return faSortUp;
    if (sortOrder === "desc") return faSortDown;
    return faSort;
  };

  const getUserRank = useCallback((username: string): number => {
    const user = initialUsers.find(u => u.username === username);
    if (!user) return 1;
    
    // Count users with higher points, or same points but higher rating
    let rank = 1;
    for (const otherUser of initialUsers) {
      if (otherUser.username === username) continue;
      
      if (otherUser.totalPoints > user.totalPoints || 
          (otherUser.totalPoints === user.totalPoints && otherUser.rating > user.rating)) {
        rank++;
      }
    }
    
    return rank;
  }, [initialUsers]);

  const sortUsers = useCallback(
    (users: IUsersListData[]) => {
      if (!sortField || !sortOrder) return users;

      return [...users].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case "username":
            aValue = a.username.toLowerCase();
            bValue = b.username.toLowerCase();
            break;
          case "rating":
            aValue = a.rating;
            bValue = b.rating;
            break;
          case "points":
            aValue = a.totalPoints;
            bValue = b.totalPoints;
            break;
          case "problems":
            aValue = a.problemsSolved;
            bValue = b.problemsSolved;
            break;
          default:
            return 0;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue);
          return sortOrder === "asc" ? comparison : -comparison;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          const comparison = aValue - bValue;
          return sortOrder === "asc" ? comparison : -comparison;
        }

        return 0;
      });
    },
    [sortField, sortOrder]
  );

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    let filtered = initialUsers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered = sortUsers(filtered);

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, initialUsers, sortField, sortOrder, sortUsers]);

  return (
    <main className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">
          <FontAwesomeIcon icon={faTrophy} className="mr-2" />
          Leaderboard
        </h1>
        <hr className="mb-6" />
        
        {/* Search Box */}
        <div className="search-controls">
          <div className="search-input-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <Input
              type="text"
              placeholder="Search users by username..."
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

        {/* Results count */}
        <div className="results-info">
          Showing {filteredUsers.length} users
          {totalPages > 1 && (
            <>
              {" "}
              • Page {currentPage} of {totalPages}
            </>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr className="data-table-header">
                <th
                  className="data-table-header-cell center"
                  style={{ width: "4rem" }}
                >
                  Rank
                </th>
                <th
                  className="data-table-header-cell center sortable"
                  onClick={() => handleSort("rating")}
                  style={{ width: "8rem" }}
                >
                  <div className="flex items-center justify-center gap-2">
                    Rating
                    <FontAwesomeIcon
                      icon={getSortIcon("rating")}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  className="data-table-header-cell sortable"
                  onClick={() => handleSort("username")}
                >
                  <div className="flex items-center gap-2">
                    Username
                    <FontAwesomeIcon
                      icon={getSortIcon("username")}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  className="data-table-header-cell center sortable"
                  onClick={() => handleSort("points")}
                  style={{ width: "6rem" }}
                >
                  <div className="flex items-center justify-center gap-2">
                    Points
                    <FontAwesomeIcon
                      icon={getSortIcon("points")}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  className="data-table-header-cell center sortable"
                  onClick={() => handleSort("problems")}
                  style={{ width: "7rem" }}
                >
                  <div className="flex items-center justify-center gap-2">
                    Problems
                    <FontAwesomeIcon
                      icon={getSortIcon("problems")}
                      className="w-3 h-3"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="data-table-body-cell center" style={{ height: "6rem" }}>
                    <span className="text-muted-foreground">
                      {searchTerm
                        ? "No users found matching your search."
                        : "No users available."}
                    </span>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr
                    key={user.username}
                    className={`data-table-body-row ${
                      user.isDeleted ? "deleted" : ""
                    }`}
                  >
                    <td className="data-table-body-cell center">
                      <span className="font-bold text-lg">
                        #{getUserRank(user.username)}
                      </span>
                    </td>
                    <td className="data-table-body-cell center" style={{ verticalAlign: 'middle' }}>
                      <RatingDisplay 
                        rating={user.rating} 
                        showIcon={true}
                      />
                    </td>
                    <td className="data-table-body-cell">
                      <Link
                        href={`/user/${user.username}`}
                        className={`username-link ${user.rating === 0 ? 'rate-none' : getRatingClass(user.rating)}`}
                        title={getRatingTitle(user.rating)}
                      >
                        {user.username}
                      </Link>
                    </td>
                    <td className="data-table-body-cell center">
                      <span className="font-medium">
                        {user.totalPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="data-table-body-cell center">
                      <span className="font-medium">
                        {user.problemsSolved}
                      </span>
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
      {currentUsers.length > 0 && (
        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            Click on a username to view their profile and detailed statistics.
          </p>
        </div>
      )}
    </main>
  );
}