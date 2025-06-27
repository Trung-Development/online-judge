"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { MagicCard } from "@/components/magicui/magic-card";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Loading from "@/app/loading";
import { AlertCircle } from "lucide-react";

const Turnstile = dynamic(() => import("next-turnstile").then(mod => mod.Turnstile), {
  ssr: false,
});

export default function LoginPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/");
    }
  }, [status, session, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return <Loading />;
  }

  // Don't render the form if user is authenticated
  if (status === "authenticated") {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formRef.current) {
      setIsLoading(false);
      return;
    }

    if (turnstileStatus !== "success") {
      setError("Please complete the Turnstile challenge.");
      setIsLoading(false);
      return;
    }

    // Get the form data including the Turnstile token
    const formDataObj = new FormData(formRef.current);
    const token = formDataObj.get("cf-turnstile-response") as string;

    const result = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
      userAgent: navigator.userAgent,
      captchaToken: token,
    });

    if (result?.error) {
      setError(result.error);
      // Reset turnstile status
      setTurnstileStatus("required");
    } else if (result?.ok) {
      router.push("/");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="p-0 max-w-sm w-full shadow-none border-none">
        <MagicCard
          gradientColor={mounted && theme === "dark" ? "#262626" : "#D9D9D955"}
          className="p-0"
        >
          <CardHeader className="border-b border-border p-4 [.border-b]:pb-4">
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
            <CardAction>
              <Button asChild variant="link">
                <Link href="/accounts/signup">Sign Up</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="p-4">
            <form ref={formRef} onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                {/* Turnstile */}
                <div className="grid gap-2">
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    retry="auto"
                    refreshExpired="auto"
                    sandbox={process.env.NODE_ENV === "development"}
                    onError={() => {
                      setTurnstileStatus("error");
                      setError("Security check failed. Please try again.");
                    }}
                    onExpire={() => {
                      setTurnstileStatus("expired");
                      setError("Security check expired. Please verify again.");
                    }}
                    onLoad={() => {
                      setTurnstileStatus("required");
                      setError("");
                    }}
                    onVerify={() => {
                      setTurnstileStatus("success");
                      setError("");
                    }}
                    theme={mounted && theme === "dark" ? "dark" : "light"}
                  />
                </div>
              </div>
              <CardFooter className="flex-col gap-2 p-0 mt-6">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </MagicCard>
      </Card>
    </div>
  );
}
