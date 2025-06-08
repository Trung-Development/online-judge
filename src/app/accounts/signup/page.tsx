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
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { timezones, languages } from "@/constants";
import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dynamic from "next/dynamic";

const HCaptcha = dynamic(() => import("@hcaptcha/react-hcaptcha"), {
  ssr: false,
});

export default function SignupPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "", // Added fullName
    username: "",
    email: "",
    password1: "",
    password2: "",
    timezone: "UTC",
    defaultLanguage: "c++17",
    dateOfBirth: undefined as Date | undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dobOpen, setDobOpen] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "";

  console.log("hCaptcha key:", hcaptchaSiteKey);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({
      ...formData,
      dateOfBirth: date,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const apiBase = process.env.API_ENDPOINT || "http://unreachable.local";
      const apiUrl = new URL("/auth/signup", apiBase).toString();

      if (
        !formData.username ||
        !formData.email ||
        !formData.password1 ||
        !formData.password2 ||
        !formData.fullName // Require fullName
      ) {
        throw new Error("All fields are required");
      }

      if (formData.password1 !== formData.password2) {
        throw new Error("Passwords do not match");
      }

      if (!hcaptchaToken) {
        throw new Error("Please complete the hCaptcha challenge.");
      }

      // Prepare data for API (convert dateOfBirth to mm/dd/yyyy if present)
      const formatDateMMDDYYYY = (date: Date) => {
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const yyyy = String(date.getFullYear());
        return `${mm}/${dd}/${yyyy}`;
      };

      const submitData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth
          ? formatDateMMDDYYYY(formData.dateOfBirth)
          : undefined,
        hcaptchaToken,
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }

      const data = await response.json();
      console.log("Signup successful:", data);

      router.push("/accounts/login");
    } catch (err) {
      // Check for network/server unreachable error
      if (
        err instanceof TypeError &&
        err.message &&
        (err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("Network request failed"))
      ) {
        setError(
          "The server is unreachable. Please contact the administrator."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "An error occurred during signup"
        );
      }
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center my-8">
      <Card className="p-0 max-w-md w-full shadow-none border-none">
        <MagicCard
          gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
          className="p-0"
        >
          <CardHeader className="border-b border-border p-4 [.border-b]:pb-4">
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Enter your information to create an account
            </CardDescription>
            <CardAction>
              <Button asChild variant="link">
                <Link href="/accounts/login">Login</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                    {error}
                  </div>
                )}
                {/* Full Name field */}
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                {/* Username field */}
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    required
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
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
                  <Label htmlFor="password1">Password</Label>
                  <Input
                    id="password1"
                    type="password"
                    required
                    value={formData.password1}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password2">Password Again</Label>
                  <Input
                    id="password2"
                    type="password"
                    placeholder="Again, for confirmation"
                    required
                    value={formData.password2}
                    onChange={handleChange}
                  />
                </div>
                {/* Date of birth field */}
                <div className="flex flex-col gap-3">
                  <Label htmlFor="dateOfBirth" className="px-1">
                    Date of birth
                  </Label>
                  <Popover open={dobOpen} onOpenChange={setDobOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-48 justify-between font-normal"
                        type="button"
                        onClick={() => setDobOpen(true)}
                      >
                        {formData.dateOfBirth
                          ? formData.dateOfBirth.toLocaleDateString()
                          : "Select date"}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={formData.dateOfBirth}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          handleDateChange(date); // store the picked date
                          setDobOpen(false); // then close the popover
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timezone-select">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      handleSelectChange("timezone", value)
                    }
                  >
                    <SelectTrigger id="timezone-select" className="w-full">
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz, i) => (
                        <SelectItem key={i} value={tz.label}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="defaultLanguage-select">
                    Default Language
                  </Label>
                  <Select
                    value={formData.defaultLanguage}
                    onValueChange={(value) =>
                      handleSelectChange("defaultLanguage", value)
                    }
                  >
                    <SelectTrigger
                      id="defaultLanguage-select"
                      className="w-full"
                    >
                      <SelectValue placeholder="Select your default language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* hCaptcha widget */}
                <div className="flex justify-center mt-2">
                  {hcaptchaSiteKey && (
                    <HCaptcha
                      sitekey={hcaptchaSiteKey}
                      onVerify={setHcaptchaToken}
                      onExpire={() => setHcaptchaToken(null)}
                      theme={theme === "dark" ? "dark" : "light"}
                    />
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2 p-4 border-t border-border [.border-t]:pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              onClick={() => document.querySelector("form")?.requestSubmit()}
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
            {/* <Button variant="outline" className="w-full">
              Sign up with Google
            </Button> */}
          </CardFooter>
        </MagicCard>
      </Card>
    </div>
  );
}
