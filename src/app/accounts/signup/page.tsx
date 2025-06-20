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
import { languages } from "@/constants";
import * as React from "react";
import { ChevronDownIcon, ChevronsUpDown, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dynamic from "next/dynamic";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const HCaptcha = dynamic(() => import("@hcaptcha/react-hcaptcha"), {
  ssr: false,
});

export default function SignupPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password1: "",
    password2: "",
    defaultLanguage: "CPP17",
    dateOfBirth: undefined as Date | undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dobOpen, setDobOpen] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const hcaptchaSiteKey =
    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ||
    process.env.HCAPTCHA_SITE_KEY ||
    "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
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
      const apiBase =
        process.env.NEXT_PUBLIC_API_ENDPOINT || "http://unreachable.local";
      const apiUrl = new URL("/client/users", apiBase).toString();

      if (
        !formData.username ||
        !formData.email ||
        !formData.password1 ||
        !formData.password2 ||
        !formData.fullName
      ) {
        throw new Error("All fields are required");
      }

      if (formData.password1 !== formData.password2) {
        throw new Error("Passwords do not match");
      }

      if (!hcaptchaToken) {
        throw new Error("Please complete the hCaptcha challenge.");
      }

      // Get client IP
      const getClientIp = async () => {
        try {
          const response = await fetch('/api/get-client-ip');
          if (response.ok) {
            const data = await response.json();
            return data.ip;
          }
        } catch (error) {
          console.error('Failed to get client IP:', error);
        }
        return 'unknown';
      };

      const clientIp = await getClientIp();

      // Prepare data for API (convert dateOfBirth to mm/dd/yyyy if present)
      const formatDateMMDDYYYY = (date: Date) => {
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const yyyy = String(date.getFullYear());
        return `${mm}/${dd}/${yyyy}`;
      };

      const submitData = {
        fullname: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password1,
        defaultLanguage: formData.defaultLanguage,
        dateOfBirth: formData.dateOfBirth
          ? formatDateMMDDYYYY(formData.dateOfBirth)
          : undefined,
        captchaToken: hcaptchaToken,
        clientIp: clientIp,
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.status !== 201) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "An error occurred during signup");
      }

      // Signup successful (201), redirect to login page
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
          "The server is unreachable. Please contact the administrator.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during signup",
        );
      }
      console.error("Signup error:", err);
      // Reset captcha on error
      setHcaptchaToken(null);
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
                {/* Default Language Combobox */}
                <div className="grid gap-2">
                  <Label htmlFor="defaultLanguage-combobox">
                    Default Language
                  </Label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full justify-between"
                        type="button"
                        id="defaultLanguage-combobox"
                      >
                        {formData.defaultLanguage
                          ? languages.find(
                              (lang) => lang.value === formData.defaultLanguage,
                            )?.label
                          : "Select your default language"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search language..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {languages.map((language) => (
                              <CommandItem
                                key={language.value}
                                value={language.value}
                                onSelect={(currentValue) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    defaultLanguage: currentValue,
                                  }));
                                  setComboboxOpen(false);
                                }}
                              >
                                {language.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    formData.defaultLanguage === language.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
