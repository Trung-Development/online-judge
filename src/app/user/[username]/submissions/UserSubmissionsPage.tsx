"use client";

import Image from "next/image";
import { IUserData } from "@/lib/server-actions/users";
import { getRatingClass, getRatingTitle } from "@/lib/rating";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import UserTabs from "../UserTabs";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface UserSubmissionsPageProps {
    userData: IUserData;
    username: string;
    serverUser?: {
        id: string;
        email: string;
        username: string;
        fullname: string;
    } | null;
}

export default function UserSubmissionsPage({ userData, username, serverUser }: UserSubmissionsPageProps) {
    // For client-side session
    const { data: clientSession } = useSession();
    const currentUser = serverUser || clientSession?.user;
    
    const ratingValue = userData.totalPoints ? Math.floor(userData.totalPoints / 10) + 1200 : 1200;
    const solvedProblems = userData.submissions.filter(s => s.status === 'AC').length;
    
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
                                <FontAwesomeIcon icon={faUser} className="w-16 h-16 text-gray-500" />
                            </div>
                        )}
                        <h1 className={`text-2xl font-bold ${getRatingClass(ratingValue)} text-center`}>
                            {username}
                        </h1>
                        <p className="text-muted-foreground text-center mb-4">
                            {getRatingTitle(ratingValue)}
                        </p>
                    </div>
                    
                    <div className="space-y-3 bg-card border rounded-lg p-4 mb-4">
                        <div>
                            <span className="font-medium">Problems solved:</span> {solvedProblems}
                        </div>
                        <div>
                            <span className="font-medium">Rank by points:</span> #{userData.rankByPoints}
                        </div>
                        <div>
                            <span className="font-medium">Total points:</span> {userData.totalPoints.toLocaleString()}
                        </div>
                    </div>
                </aside>
                
                {/* Main content */}
                <div className="user-content">
                    <UserTabs username={username} currentUser={currentUser} />
                    
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-4">All Submissions</h2>
                        
                        {userData.submissions.length === 0 ? (
                            <div className="bg-card border rounded-lg p-6">
                                <p className="text-muted-foreground text-center py-8">
                                    No submissions yet.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-card border rounded-lg p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4">Problem</th>
                                                <th className="text-left py-3 px-4">Status</th>
                                                <th className="text-left py-3 px-4">Points</th>
                                                <th className="text-left py-3 px-4">Language</th>
                                                <th className="text-left py-3 px-4">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userData.submissions
                                                .sort((a, b) => b.timestamp - a.timestamp)
                                                .map((submission, index) => (
                                                <tr key={index} className="border-b hover:bg-muted/50">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <Link href={`/problem/${submission.problemCode}`} className="font-medium hover:text-primary">
                                                                {submission.problemName}
                                                            </Link>
                                                            <div className="text-sm text-muted-foreground">
                                                                {submission.problemCode} • {submission.problemCategory}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            submission.status === 'AC' 
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : submission.status === 'WA'
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        }`}>
                                                            {submission.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="font-medium">
                                                            {submission.points}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm">
                                                            {Array.isArray(submission.language) ? submission.language.join(", ") : submission.language}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(Number(submission.timestamp)).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
