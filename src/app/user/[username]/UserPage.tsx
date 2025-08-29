"use client";

import Image from "next/image";
import {
  IActivityHeatmapSubmission,
  IUserData,
} from "@/lib/server-actions/users";
import { getRatingClass, getRatingTitle } from "@/lib/rating";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import UserTabs from "./UserTabs";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import ActivityHeatmap from "@/components/ActivityHeatmap";

interface UserPageProps {
  userData: IUserData;
  username: string;
  serverUser?: {
    id: string;
    email: string;
    username: string;
    fullname: string;
    defaultRuntime: string;
  } | null;
  heatmapSubs: IActivityHeatmapSubmission[];
}

export default function UserPage({
  userData,
  username,
  serverUser,
  heatmapSubs,
}: UserPageProps) {
  // For client-side session
  const { user: clientUser } = useAuth();
  const currentUser = serverUser || clientUser;

  const solvedProblems = userData.solvedProblems;
  const totalPoints = userData.totalPoints;

  const ratingValue = userData.rating || 0;

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
              {typeof ratingValue === "number"
                ? getRatingTitle(ratingValue)
                : ratingValue}
            </p>
          </div>

          <div className="space-y-3 bg-card border rounded-lg p-4 mb-4">
            <div>
              <span className="font-medium">Problems solved:</span>{" "}
              {solvedProblems}
            </div>
            <div>
              <span className="font-medium">Total points:</span>{" "}
              {totalPoints.toLocaleString()}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <Link
              href={`/submissions?${new URLSearchParams({ author: username }).toString()}`}
              className="text-primary hover:underline block"
            >
              View all submissions
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="user-content">
          <UserTabs username={username} currentUser={currentUser} />

          {userData.bio && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Bio</h2>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-foreground">{userData.bio}</p>
              </div>
            </div>
          )}

          {/* Activity Heatmap */}
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Submission Activity</h2>

            {heatmapSubs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No submissions yet.
              </p>
            ) : (
              <div className="submission-activity">
                <ActivityHeatmap submissions={heatmapSubs} />
              </div>
            )}
          </div>

          {/* Rating History */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Rating History</h2>
            <div className="relative w-full h-[300px] bg-muted/20 rounded-md border border-border">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Rating history chart will be displayed here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
