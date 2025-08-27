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
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { languages } from "@/constants";
import * as React from "react";
import { ChevronDownIcon, ChevronsUpDown, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import Loading from "@/app/loading";
import { registerUser } from "@/lib/server-actions/auth";
import { AlertCircle } from "lucide-react";
import { env } from "@/lib/env";

const Turnstile = dynamic(
  () => import("next-turnstile").then((mod) => mod.Turnstile),
  {
    ssr: false,
  },
);

export default function SignupPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password1: "",
    password2: "",
    defaultRuntime: "CPP17",
    dateOfBirth: undefined as Date | undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dobOpen, setDobOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return <Loading />;
  }

  // Don't render the form if user is authenticated
  if (user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    // Username validation
    if (id === "username") {
      // Allow only a-z, A-Z, 0-9, -, _, and . (dots)
      const usernameRegex = /^[a-zA-Z0-9\-_.]*$/;

      if (value && !usernameRegex.test(value)) {
        // Don't update if invalid characters are entered
        return;
      }
    }

    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({
      ...formData,
      dateOfBirth: date,
    });
    if (date) {
      setCalendarDate(date);
    }
  };

  // Helper functions for custom calendar navigation
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleMonthChange = (month: string) => {
    const monthIndex = months.indexOf(month);
    const newDate = new Date(calendarDate.getFullYear(), monthIndex, 1);
    setCalendarDate(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(parseInt(year), calendarDate.getMonth(), 1);
    setCalendarDate(newDate);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (
        !formData.username ||
        !formData.email ||
        !formData.password1 ||
        !formData.password2 ||
        !formData.fullName
      ) {
        throw new Error("All fields are required");
      }

      // Username validation
      const usernameRegex = /^[a-zA-Z0-9\-_.]+$/;
      if (!usernameRegex.test(formData.username)) {
        throw new Error(
          "Username can only contain letters, numbers, hyphens (-), underscores (_), and dots (.)",
        );
      }

      if (formData.username.length < 4) {
        throw new Error("Username must be at least 4 characters long");
      }

      if (formData.username.length > 30) {
        throw new Error("Username must be no more than 30 characters long");
      }

      if (formData.password1 !== formData.password2) {
        throw new Error("Passwords do not match");
      }

      if (!formRef.current) {
        throw new Error("Form not found");
      }

      if (turnstileStatus !== "success") {
        throw new Error("Please complete the Turnstile challenge.");
      }

      // Get the form data including the Turnstile token
      const formDataObj = new FormData(formRef.current);
      const token = formDataObj.get("cf-turnstile-response") as string;

      if (!token) {
        throw new Error("Turnstile verification failed, please try again.");
      }

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
        defaultRuntime: formData.defaultRuntime,
        dateOfBirth: formData.dateOfBirth
          ? formatDateMMDDYYYY(formData.dateOfBirth)
          : undefined,
        captchaToken: token,
      };

      // Use server action instead of client-side fetch
      const result = await registerUser(submitData);

      if (!result.success) {
        throw new Error(result.error || "An error occurred during signup");
      }

      // Signup successful, redirect to login page
      router.push("/accounts/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during signup",
      );
      console.error("Signup error:", err);
      // Reset turnstile status on error
      setTurnstileStatus("required");
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
            <form ref={formRef} onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
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
                    placeholder="johndoe123"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    minLength={4}
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    4-30 characters. Only letters, numbers, hyphens (-),
                    underscores (_), and dots (.) allowed.
                  </p>
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
                      <div className="p-3 border-b border-border">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Select
                            value={months[calendarDate.getMonth()]}
                            onValueChange={handleMonthChange}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={calendarDate.getFullYear().toString()}
                            onValueChange={handleYearChange}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-48">
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Calendar
                        mode="single"
                        selected={formData.dateOfBirth}
                        month={calendarDate}
                        onMonthChange={setCalendarDate}
                        onSelect={(date) => {
                          handleDateChange(date);
                          setDobOpen(false);
                        }}
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Default Language Combobox */}
                <div className="grid gap-2">
                  <Label htmlFor="defaultRuntime-combobox">
                    Default Runtime
                  </Label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full justify-between"
                        type="button"
                        id="defaultRuntime-combobox"
                      >
                        {formData.defaultRuntime
                          ? languages.find(
                              (lang) => lang.value === formData.defaultRuntime,
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
                                    defaultRuntime: currentValue,
                                  }));
                                  setComboboxOpen(false);
                                }}
                              >
                                {language.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    formData.defaultRuntime === language.value
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
                {/* Turnstile widget */}
                <div className="flex justify-center mt-2">
                  {turnstileSiteKey && (
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
                        setError(
                          "Security check expired. Please verify again.",
                        );
                      }}
                      onLoad={() => {
                        setTurnstileStatus("required");
                        setError("");
                      }}
                      onVerify={() => {
                        setTurnstileStatus("success");
                        setError("");
                      }}
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
