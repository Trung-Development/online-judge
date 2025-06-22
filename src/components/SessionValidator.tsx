"use client";

import { usePeriodicSessionValidation } from "@/hooks/use-session-validation";

interface SessionValidatorProps {
  children: React.ReactNode;
  validationIntervalMs?: number;
}

export default function SessionValidator({
  children,
  validationIntervalMs = 60000, // Default: check every minute
}: SessionValidatorProps) {
  usePeriodicSessionValidation(validationIntervalMs);

  return <>{children}</>;
}
