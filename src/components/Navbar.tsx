"use client"

import * as React from "react"
import Link from "next/link"
import { ActivityIcon } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

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
                  <Link href="/about">About</Link>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-white text-black border border-zinc-200">
                  <ul className="grid w-[200px] gap-2 p-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <a 
                          href="https://github.com/Trung-Development/online-judge" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                          <img
                            src="/assets/icons/github.svg"
                            alt="GitHub"
                            width={16}
                            height={16}
                            className="text-black"
                          />
                          <span className="text-black">GitHub</span>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link 
                          href="/status"
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors"
                        >
                          <ActivityIcon size={16} className="text-black" />
                          <span className="text-black">Status</span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
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