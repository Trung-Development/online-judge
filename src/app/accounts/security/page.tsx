"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Clock,
  Globe,
  Users,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import SessionManager from "@/components/SessionManager";

export default function SecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push("/accounts/login?callbackUrl=/accounts/security");
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null;
  }
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Security & Sessions
        </h1>
        <p className="text-muted-foreground">
          Manage your account security and active sessions across devices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Security Status Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Session Security
            </CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              IP & device binding enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Session Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Valid</div>
            <p className="text-xs text-muted-foreground">JWT-based sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limiting</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Protected</div>
            <p className="text-xs text-muted-foreground">
              10 requests/min limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Concurrent Sessions
            </CardTitle>
            <Globe className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Maximum allowed devices
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Security Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Enhanced Security Features
            </CardTitle>
            <CardDescription>
              Your account is protected with advanced security measures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">IP Address Binding</div>
                  <div className="text-sm text-muted-foreground">
                    Sessions are tied to your current IP address
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Device Fingerprinting</div>
                  <div className="text-sm text-muted-foreground">
                    Browser and device identification for extra security
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">
                    Suspicious Activity Detection
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Automatic detection and prevention of security threats
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Session Invalidating</div>
                  <div className="text-sm text-muted-foreground">
                    Immediate invalidation of compromised sessions
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Security Recommendations
            </CardTitle>
            <CardDescription>
              Best practices to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">
                  Avoid Public Networks
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  IP binding may log you out when switching networks
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  Monitor Active Sessions
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Regularly check and remove unknown sessions
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="font-medium text-green-800 dark:text-green-200">
                  Use Strong Passwords
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Combined with our security features for maximum protection
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Manager */}
      <SessionManager />
    </div>
  );
}
