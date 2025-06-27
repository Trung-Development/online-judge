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
import { Home, RefreshCw, OctagonMinus } from "lucide-react";
import { useParams } from "next/navigation";

interface ForbiddenErrorProps {
  reset: () => void;
}

export default function Forbidden({ reset }: ForbiddenErrorProps) {
  const { theme } = useTheme();
  const { slug } = useParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="p-0 max-w-lg w-full shadow-none border-none">
        <MagicCard
          gradientColor={mounted && theme === "dark" ? "#262626" : "#D9D9D955"}
          className="p-0"
        >
          <CardHeader className="text-center p-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <OctagonMinus className="h-16 w-16 text-muted-foreground" />
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">!</span>
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Problem inaccessible
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              You&apos;re not allowed to view problem {slug}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                The problem you&apos;re looking for is private and only
                available to some users. Please check the problems list page or
                try again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={reset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/problems">
                    <Home className="h-4 w-4 mr-2" />
                    Go to problems list
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </MagicCard>
      </Card>
    </div>
  );
}
