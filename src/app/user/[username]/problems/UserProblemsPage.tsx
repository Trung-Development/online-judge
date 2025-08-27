"use client";

import Image from "next/image";
import { ISolvedAndAttemptedProblems, IUserData } from "@/lib/server-actions/users";
import { getRatingClass, getRatingTitle } from "@/lib/rating";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import UserTabs from "../UserTabs";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

interface UserProblemsPageProps {
  userData: IUserData;
  username: string;
  serverUser?: {
    id: string;
    email: string;
    username: string;
    fullname: string;
    defaultRuntime: string;
  } | null;
  SAP: ISolvedAndAttemptedProblems
  categories: {
    id: number,
    name: string,
  }[]
}

export default function UserProblemsPage({
  userData,
  username,
  serverUser,
  SAP,
  categories
}: UserProblemsPageProps) {
  // For client-side session
  const { user: clientUser } = useAuth();
  const currentUser = serverUser || clientUser;

  const ratingValue = userData.rating || 0;

  // Group problems by category
  const solvedProbsByCat = new Map<number, { code: string; name: string; points: number }[]>();
  const attemptedProbsByCat = new Map<number, { code: string; name: string; points: number }[]>();
  const pointsByCategory: { [key: number]: number } = {};

  // Track maximum points for each problem
  const solvedProblems: {slug:string,name:string}[] = [];
  const attemptedProblems = new Map<string, { name: string, points: number }>();

  SAP.data.forEach((prob) => {
    if (prob.solved) {
      solvedProblems.push({
        slug: prob.slug,
        name: prob.name,
      });
    } else {
      attemptedProblems.set(prob.slug, {name: prob.name, points: prob.points});
    }
  });

  // Group problems by category using the maximum points
  SAP.data.forEach((prob) => {
    const map = prob.solved ? solvedProbsByCat : attemptedProbsByCat;
      const total_probs = map.get(prob.categoryId) || [];
      total_probs?.push({
        code: prob.slug,
        name: prob.name,
        points: prob.points,
      });
      map.set(prob.categoryId, total_probs || []);

      pointsByCategory[prob.categoryId] = (pointsByCategory[prob.categoryId] || 0) + prob.points;
  });

  // Calculate total points based on maximum points for unique problems
  const totalPoints = SAP.totalPoints;

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="user-profile grid md:grid-cols-[250px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="user-sidebar">
          <div className="mb-6 flex flex-col items-center">
            {userData.avatarURL ? (
              <Image
                src={userData.avatarURL}
                alt={`${username}'s avatar`}
                width={128}
                height={128}
                className="w-32 h-32 rounded-full mb-4"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center mb-4">
                <FontAwesomeIcon
                  icon={faUser}
                  className="w-16 h-16 text-gray-500"
                />
              </div>
            )}
            <h1
              className={`text-2xl font-bold ${getRatingClass(ratingValue)} text-center`}
            >
              {username}
            </h1>
            <p className="text-muted-foreground text-center mb-4">
              {getRatingTitle(ratingValue)}
            </p>
          </div>

          <div className="space-y-3 bg-card border rounded-lg p-4 mb-4">
            <div>
              <span className="font-medium">Problems solved:</span>{" "}
              {SAP.data.filter(v => v.solved).length}
            </div>
            <div>
              <span className="font-medium">Total points:</span>{" "}
              {totalPoints.toLocaleString()}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <Link
              href={`/user/${username}/submissions`}
              className="text-primary hover:underline block"
            >
              View all submissions
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="user-content">
          <UserTabs username={username} currentUser={currentUser} />

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4">Solved Problems</h2>

            {SAP.data.filter(v => v.solved).length === 0 ? (
              <div className="bg-card border rounded-lg p-6">
                <p className="text-muted-foreground text-center py-4">
                  No solved problems yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {solvedProbsByCat.entries().map(([categoryId, problems]) => {
                  const categoryName = categories.find(v => v.id === categoryId)?.name || "Unknown";
                  return (
                    <div
                      key={categoryId}
                      className="bg-card border rounded-lg p-6"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{categoryName}</h3>
                        <p className="text-muted-foreground">
                          {pointsByCategory[categoryId]} points
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {problems.map((problem) => (
                          <Link
                            key={problem.code}
                            href={`/problem/${problem.code}`}
                            className="p-3 border rounded-md hover:bg-muted/50 flex justify-between"
                          >
                            <div>
                              <p className="font-medium">{problem.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {problem.code}
                              </p>
                            </div>
                            <div className="text-sm font-medium">
                              {problem.points} pts
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4">Attempted Problems</h2>

            {SAP.data.filter(v => !v.solved).length === 0 ? (
              <div className="bg-card border rounded-lg p-6">
                <p className="text-muted-foreground text-center py-4">
                  No attempted problems yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {attemptedProbsByCat.entries().map(([categoryId, problems]) => {
                  const categoryName = categories.find(v => v.id === categoryId)?.name || "Unknown";
                  return (
                    <div
                      key={categoryId}
                      className="bg-card border rounded-lg p-6"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{categoryName}</h3>
                        <p className="text-muted-foreground">
                          {pointsByCategory[categoryId]} points
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {problems.map((problem) => (
                          <Link
                            key={problem.code}
                            href={`/problem/${problem.code}`}
                            className="p-3 border rounded-md hover:bg-muted/50 flex justify-between"
                          >
                            <div>
                              <p className="font-medium">{problem.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {problem.code}
                              </p>
                            </div>
                            <div className="text-sm font-medium">
                              {problem.points} pts
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
