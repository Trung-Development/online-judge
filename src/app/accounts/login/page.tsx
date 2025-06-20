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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import dynamic from "next/dynamic";

const HCaptcha = dynamic(() => import("@hcaptcha/react-hcaptcha"), {
  ssr: false,
});

export default function LoginPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  
  const hcaptchaSiteKey =
    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ||
    process.env.HCAPTCHA_SITE_KEY ||
    "";

  useEffect(() => {
    setMounted(true);
  }, []);

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

    if (!hcaptchaToken) {
      setError("Please complete the hCaptcha challenge.");
      setIsLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
      userAgent: navigator.userAgent,
      captchaToken: hcaptchaToken,
    });

    if (result?.error) {
      setError(result.error);
      // Reset captcha on error
      setHcaptchaToken(null);
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
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                    {error}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
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
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                
                {/* hCaptcha */}
                <div className="grid gap-2">
                  <HCaptcha
                    sitekey={hcaptchaSiteKey}
                    onVerify={(token) => setHcaptchaToken(token)}
                    onExpire={() => setHcaptchaToken(null)}
                    onError={() => setHcaptchaToken(null)}
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
