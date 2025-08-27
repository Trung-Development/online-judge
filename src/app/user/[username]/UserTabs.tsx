"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface UserTabsProps {
  username: string;
  currentUser?: User | null;
}

export default function UserTabs({ username, currentUser }: UserTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "About",
      href: `/user/${username}`,
      active: pathname === `/user/${username}`,
    },
    {
      name: "Problems",
      href: `/user/${username}/problems`,
      active: pathname === `/user/${username}/problems`,
    },
    {
      name: "Submissions",
      href: `/submissions?author=${username}`,
      active: pathname === `/submissions?author=${username}`,
    },
  ];

  // Check if the current user matches the profile being viewed
  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="border-b mb-6">
      <div className="flex flex-wrap -mb-px">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "inline-flex items-center px-4 py-2 font-medium border-b-2",
              tab.active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-muted-foreground",
            )}
          >
            {tab.name}
          </Link>
        ))}

        {isOwnProfile && (
          <Link
            href={`/edit/profile`}
            className="inline-flex items-center px-4 py-2 font-medium border-b-2 border-transparent text-muted-foreground hover:border-muted-foreground ml-auto"
          >
            Edit Profile
          </Link>
        )}
      </div>
    </div>
  );
}
