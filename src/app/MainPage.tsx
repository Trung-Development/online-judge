"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MagicCard } from "@/components/magicui/magic-card";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Construction, Rocket, Coffee, Code2 } from "lucide-react";

export default function Home() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="p-0 max-w-2xl w-full shadow-none border-none">
        <MagicCard
          gradientColor={mounted && theme === "dark" ? "#262626" : "#D9D9D955"}
          className="p-0"
        >
          <CardHeader className="text-center p-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Construction className="h-20 w-20 text-primary animate-bounce" />
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              YACPS Online Judge
            </CardTitle>
            <CardDescription className="text-xl mt-4">
              🚧 Under Development 🚧
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-center space-y-6">
              <p className="text-lg text-muted-foreground">
                We&apos;re working hard to bring you an amazing competitive
                programming platform!
              </p>

              <div className="grid md:grid-cols-3 gap-4 my-8">
                <div className="flex flex-col items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <Code2 className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                    Problem Solving
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                    Challenging problems for all skill levels
                  </p>
                </div>

                <div className="flex flex-col items-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <Rocket className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-green-900 dark:text-green-200">
                    Contests
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 text-center">
                    Regular programming contests
                  </p>
                </div>

                <div className="flex flex-col items-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <Coffee className="h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-200">
                    Community
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300 text-center">
                    Connect with fellow programmers
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-lg mb-2">
                  What&apos;s Coming Soon?
                </h4>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Interactive problem submission and judging
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Real-time contest participation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Detailed performance analytics
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    Discussion forums and tutorials
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild className="flex-1">
                  <Link href="/accounts/login">
                    <Code2 className="h-4 w-4 mr-2" />
                    Login to Get Started
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/accounts/signup">
                    <Rocket className="h-4 w-4 mr-2" />
                    Create Account
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                💡 Want to stay updated? Create an account and we&apos;ll notify
                you when we launch!
              </p>
            </div>
          </CardContent>
        </MagicCard>
      </Card>
    </div>
  );
}
