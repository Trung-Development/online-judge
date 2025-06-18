"use client";

import * as React from "react";
import Link from "next/link";
import { ActivityIcon } from "lucide-react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

import { useSession, signOut } from "next-auth/react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import { ModeToggle } from "./ThemeToggle";
import { MobileSidebar } from "./MobileSidebar";
import { getGravatarURL } from "@/lib/utils";

function ListItem({
  title,
  children,
  href,
  icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="flex items-start gap-2 rounded-md p-3 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {icon && <span className="mt-1">{icon}</span>}
          <div>
            <div className="text-sm font-medium leading-none">{title}</div>
            {children && (
              <p className="text-muted-foreground text-xs leading-snug mt-1">
                {children}
              </p>
            )}
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const avatarUrl = user?.email ? getGravatarURL(user.email) : undefined;

  // Prevent hydration mismatch by not rendering until session is loaded
  if (status === "loading") {
    return null;
  }

  return (
    <div className="w-full bg-zinc-900 border-b border-zinc-800 relative z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Mobile Sidebar Trigger */}
          <div className="px-3 py-4 lg:hidden">
            <MobileSidebar />
          </div>

          {/* Logo - hidden on mobile */}
          <div className="hidden lg:block px-6 py-4">
            <Link
              href="/"
              className="text-zinc-100 text-xl font-bold hover:text-zinc-300 transition-colors"
            >
              YACPS
            </Link>
          </div>

          {/* Separator - hidden on mobile */}
          <div className="hidden lg:block h-8 w-px bg-zinc-500 mx-6"></div>

          {/* Navigation Menu - hidden on mobile */}
          <NavigationMenu
            viewport={false}
            className="hidden lg:flex bg-zinc-900 text-zinc-100"
          >
            <NavigationMenuList className="bg-zinc-900 text-zinc-100 justify-start">
              {/* Home */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100`}
                >
                  <Link href="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Problems */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100`}
                >
                  <Link href="/problems">Problems</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Submissions */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100`}
                >
                  <Link href="/submissions">Submissions</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Users */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100`}
                >
                  <Link href="/users">Users</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Contests */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100`}
                >
                  <Link href="/contests">Contests</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* About - with dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100 data-[state=open]:bg-zinc-800">
                  About
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] p-2">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none select-none focus:shadow-md"
                          href="/about"
                        >
                          <div className="mt-4 mb-2 text-lg font-bold">
                            About YACPS
                          </div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            Yet Another Competitive Programming System.
                            Open-source, modern, and built for learning.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem
                      href="https://github.com/Trung-Development/online-judge"
                      title="GitHub"
                      icon={<FontAwesomeIcon icon={faGithub} className="h-4 w-4" />}
                    >
                      Source code and contributions.
                    </ListItem>
                    <ListItem
                      href="/status"
                      title="Status"
                      icon={<ActivityIcon size={16} />}
                    >
                      System status and uptime.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Auth Buttons or User Dropdown */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 px-2 sm:px-3 lg:px-6">
          {!user ? (
            <>
              <Link
                href="/accounts/login"
                className="px-2 py-2 sm:px-3 lg:px-4 text-zinc-100 hover:text-zinc-300 transition-colors text-xs sm:text-sm font-medium"
              >
                Login
              </Link>
              <span className="text-zinc-500 text-xs font-light">or</span>
              <Link
                href="/accounts/signup"
                className="px-2 py-2 sm:px-3 lg:px-4 bg-zinc-100 text-zinc-900 rounded-md hover:bg-zinc-200 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <NavigationMenu viewport={false}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="flex items-center gap-2 bg-transparent hover:bg-zinc-800 text-zinc-100 p-2 rounded-md data-[state=open]:bg-zinc-800 focus:ring-0 focus:ring-offset-0">
                    {avatarUrl && (
                      <Image
                        src={avatarUrl}
                        alt="avatar"
                        width={24}
                        height={24}
                        className="rounded-full border border-zinc-400"
                      />
                    )}
                    <span className="hidden sm:inline lg:inline">
                      <b>{user.fullname || user.username}</b>
                    </span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {/* Use theme-aware classes from your UI library */}
                    <ul className="grid w-[150px] gap-1 p-2">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/profile/edit" // Placeholder path
                            className="block w-full text-left px-3 py-2 text-sm rounded-md"
                          >
                            Edit Profile
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <button
                            className="block w-full text-left px-3 py-2 text-sm rounded-md"
                            onClick={() => signOut()}
                          >
                            Logout
                          </button>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
          <div className="ml-1 lg:ml-0">
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
