"use client";

import * as React from "react";
import Link from "next/link";
import { ActivityIcon, ChevronDown, Cog, Shield } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  faSquarePen,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "@/components/AuthProvider";
import { useSessionValidation } from "@/hooks/use-session-validation";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { user, isLoading } = useAuth();
  const { logout } = useSessionValidation();
  const avatarUrl = user?.email ? getGravatarURL(user.email) : undefined;
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const pathname = usePathname();

  // Indicator state for animated highlight
  const navListRef = React.useRef<HTMLUListElement | null>(null);
  const [indicator, setIndicator] = React.useState({ left: 0, width: 0, opacity: 0 });

  const updateIndicator = (el: HTMLElement | null) => {
    if (!el || !navListRef.current) {
      setIndicator((s) => ({ ...s, opacity: 0 }));
      return;
    }
    const container = navListRef.current as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    // account for horizontal scroll inside the container
    const left = Math.round(rect.left - containerRect.left + container.scrollLeft);
    const width = Math.round(rect.width);
    setIndicator({ left, width, opacity: 1 });
  };

  const computeActiveLink = () => {
    if (!navListRef.current) return null;
    const links = Array.from(navListRef.current.querySelectorAll<HTMLElement>('[data-nav]'));
    if (links.length === 0) return null;

    // pick the best matching href (longest prefix match)
    // special-case root ('/') so it only matches exactly
    let best: { el: HTMLElement | null; len: number } = { el: null, len: 0 };
    links.forEach((el) => {
      const href = el.getAttribute("data-href") || "";
      if (!href) return;
      if (href === "/") {
        // only match root exactly
        if (pathname === "/") {
          if (href.length > best.len) best = { el, len: href.length };
        }
      } else {
        if (pathname === href || pathname.startsWith(href)) {
          if (href.length > best.len) best = { el, len: href.length };
        }
      }
    });
    if (best.el) return best.el;
  // fallback: if we have a link with href exactly matching pathname
  // otherwise return null (don't default to the first link) so we don't
  // highlight Home on unrelated routes like /accounts/security
  return links.find((el) => el.getAttribute("data-href") === pathname) || null;
  };

  React.useLayoutEffect(() => {
    // update on path change
    const active = computeActiveLink();
    // use rAF to avoid layout thrashing
    const raf = requestAnimationFrame(() => updateIndicator(active as HTMLElement | null));

    // update on resize
    const onResize = () => {
      const active2 = computeActiveLink();
      requestAnimationFrame(() => updateIndicator(active2 as HTMLElement | null));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
          <NavigationMenu viewport={false} className="hidden lg:flex bg-zinc-900 text-zinc-100">
            <NavigationMenuList ref={navListRef} className="bg-zinc-900 text-zinc-100 justify-start relative isolate z-0">
              {/* Animated indicator - rounded pill behind links */}
              <div
                aria-hidden
                className="absolute top-1/2 -translate-y-1/2 h-9 rounded-full bg-[#2563EB] transition-all duration-300 ease-out pointer-events-none"
                style={{
                  transform: `translate3d(${indicator.left}px, 0, 0)`,
                  width: `${indicator.width}px`,
                  opacity: indicator.opacity,
                  zIndex: 10, // sit above background but behind link content
                }}
              />

              {/* Home */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} !bg-transparent !text-zinc-100 !hover:bg-transparent hover:text-zinc-100 focus:!text-zinc-100 data-[active=true]:!bg-transparent data-[active=true]:!hover:bg-transparent data-[active=true]:!text-zinc-100 data-[state=open]:!text-zinc-100`}
                >
                  <Link href="/" data-nav data-href="/" className="relative inline-block px-3 py-2 z-30 !text-zinc-100" onMouseEnter={(e) => updateIndicator(e.currentTarget as HTMLElement)} onMouseLeave={() => updateIndicator(computeActiveLink() as HTMLElement | null)}>Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Problems */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} !bg-transparent !text-zinc-100 !hover:bg-transparent hover:text-zinc-100 focus:!text-zinc-100 data-[active=true]:!bg-transparent data-[active=true]:!hover:bg-transparent data-[active=true]:!text-zinc-100 data-[state=open]:!text-zinc-100`}
                >
                  <Link href="/problems" data-nav data-href="/problems" className="relative inline-block px-3 py-2 z-30 !text-zinc-100" onMouseEnter={(e) => updateIndicator(e.currentTarget as HTMLElement)} onMouseLeave={() => updateIndicator(computeActiveLink() as HTMLElement | null)}>Problems</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Submissions */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} !bg-transparent !text-zinc-100 !hover:bg-transparent hover:text-zinc-100 focus:!text-zinc-100 data-[active=true]:!bg-transparent data-[active=true]:!hover:bg-transparent data-[active=true]:!text-zinc-100 data-[state=open]:!text-zinc-100`}
                >
                  <Link href="/submissions" data-nav data-href="/submissions" className="relative inline-block px-3 py-2 z-30 !text-zinc-100" onMouseEnter={(e) => updateIndicator(e.currentTarget as HTMLElement)} onMouseLeave={() => updateIndicator(computeActiveLink() as HTMLElement | null)}>Submissions</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Users */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} !bg-transparent !text-zinc-100 !hover:bg-transparent hover:text-zinc-100 focus:!text-zinc-100 data-[active=true]:!bg-transparent data-[active=true]:!hover:bg-transparent data-[active=true]:!text-zinc-100 data-[state=open]:!text-zinc-100`}
                >
                  <Link href="/users" data-nav data-href="/users" className="relative inline-block px-3 py-2 z-30 !text-zinc-100" onMouseEnter={(e) => updateIndicator(e.currentTarget as HTMLElement)} onMouseLeave={() => updateIndicator(computeActiveLink() as HTMLElement | null)}>Users</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Contests */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} !bg-transparent !text-zinc-100 !hover:bg-transparent hover:text-zinc-100 focus:!text-zinc-100 data-[active=true]:!bg-transparent data-[active=true]:!hover:bg-transparent data-[active=true]:!text-zinc-100 data-[state=open]:!text-zinc-100`}
                >
                  <Link href="/contests" data-nav data-href="/contests" className="relative inline-block px-3 py-2 z-30 !text-zinc-100" onMouseEnter={(e) => updateIndicator(e.currentTarget as HTMLElement)} onMouseLeave={() => updateIndicator(computeActiveLink() as HTMLElement | null)}>Contests</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* About - with dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="!bg-transparent !text-zinc-100 !hover:bg-transparent hover:text-zinc-100 focus:!text-zinc-100 data-[state=open]:!bg-transparent data-[state=open]:!text-zinc-100">
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
                          <div className="mt-4 mb-2 text-lg font-bold">About YACPS</div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            Yet Another Competitive Programming System.
                            Open-source, modern, and built for learning.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="https://github.com/Trung-Development/online-judge" title="GitHub" icon={<FontAwesomeIcon icon={faGithub} className="h-4 w-4" />}>Source code and contributions.</ListItem>
                    <ListItem href="/status" title="Status" icon={<ActivityIcon size={16} />}>System status and uptime.</ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Auth Buttons or User Dropdown */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 px-2 sm:px-3 lg:px-6">
          {isLoading ? (
            // Optional: show skeleton or loading spinner
            <div className="h-6 w-24 bg-zinc-700 rounded animate-pulse" />
          ) : !user ? (
            // Not authenticated
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
            // Authenticated: show dropdown
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger className="flex items-center gap-2 bg-transparent hover:bg-zinc-800 text-zinc-100 p-2 rounded-md focus:ring-0 focus:ring-offset-0 outline-none transition-colors">
                {avatarUrl && (
                  <Image
                    src={avatarUrl}
                    alt="avatar"
                    width={24}
                    height={24}
                    className="rounded-full border border-zinc-400"
                  />
                )}
                <span className="inline">
                  <b>{user.fullname || user.username}</b>
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ease-in-out ${
                    isDropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[170px]">
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit" className="w-full cursor-pointer flex items-center gap-2">
                    <FontAwesomeIcon icon={faSquarePen} className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/accounts/security" className="w-full cursor-pointer flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/accounts/security" className="w-full cursor-pointer flex items-center gap-2">
                    <Cog className="h-4 w-4" />
                    Manage
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button className="w-full text-left cursor-pointer flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => logout()}>
                    <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="ml-1 lg:ml-0">
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
 