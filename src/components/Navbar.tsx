"use client"

import * as React from "react"
import Link from "next/link"
import { ActivityIcon } from "lucide-react"
import Image from "next/image"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

function ListItem({
  title,
  children,
  href,
  icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string; icon?: React.ReactNode }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href} className="flex items-start gap-2 rounded-md p-3 hover:bg-gray-100 transition-colors">
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
  )
}

export function Navbar() {
  return (
    <div className="w-full bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Logo */}
          <div className="px-6 py-4">
            <Link href="/" className="text-zinc-100 text-xl font-bold hover:text-zinc-300 transition-colors">
              YACPS
            </Link>
          </div>

          {/* Separator */}
          <div className="h-8 w-px bg-zinc-500 mx-6"></div>

          {/* Navigation Menu */}
          <NavigationMenu
            viewport={false}
            className="bg-zinc-900 text-zinc-100"
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
                <NavigationMenuTrigger className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100 data-[state=open]:bg-white data-[state=open]:text-black">
                  About
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-white text-black border border-zinc-200">
                  <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] p-2">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b from-gray-50 to-gray-100 p-6 no-underline outline-none select-none focus:shadow-md"
                          href="/about"
                        >
                          <div className="mt-4 mb-2 text-lg font-bold text-black">
                            About YACPS
                          </div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            Yet Another Competitive Programming System. Open-source, modern, and built for learning.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem
                      href="https://github.com/Trung-Development/online-judge"
                      title="GitHub"
                      icon={
                        <Image
                          src="/assets/icons/github.svg"
                          alt="GitHub"
                          width={16}
                          height={16}
                          className="text-black"
                        />
                      }
                    >
                      Source code and contributions.
                    </ListItem>
                    <ListItem
                      href="/status"
                      title="Status"
                      icon={<ActivityIcon size={16} className="text-black" />}
                    >
                      System status and uptime.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2 px-6">
          <Link 
            href="/accounts/login" 
            className="px-4 py-2 text-zinc-100 hover:text-zinc-300 transition-colors text-sm font-medium"
          >
            Login
          </Link>
          <span className="text-zinc-500 text-xs font-light">or</span>
          <Link 
            href="/accounts/signup" 
            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md hover:bg-zinc-200 transition-colors text-sm font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}