"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSessionValidation } from "@/hooks/use-session-validation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  Monitor,
  Smartphone,
  Globe,
  LogOut,
} from "lucide-react";

interface SessionData {
  id: string;
  ip: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string;
}

// Simple Badge component since it's not available
function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  const baseClasses =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    outline: "border border-gray-200 text-gray-700",
    secondary: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function SessionManager() {
  const { getActiveSessions, logoutAllSessions, isAuthenticated } =
    useSessionValidation();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const activeSessions = await getActiveSessions();
      setSessions(activeSessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
    setLoading(false);
  }, [isAuthenticated, getActiveSessions]);

  useEffect(() => {
    loadSessions();
  }, [isAuthenticated, loadSessions]);

  const handleLogoutAll = async () => {
    if (
      confirm(
        "Are you sure you want to logout from all sessions? This will sign you out from all devices."
      )
    ) {
      await logoutAllSessions();
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getLocationBadge = (ip: string) => {
    return (
      <Badge variant="outline" className="text-xs">
        <Globe className="h-3 w-3 mr-1" />
        {ip}
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      const mins = diffMins % 60;
      if (mins === 0) return `${diffHours}h ago`;
      return `${diffHours}h ${mins}m ago`;
    }
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const formatTimeUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    // If the date is in the past, it's expired
    if (diffMs <= 0) return "Expired";
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Less than 1m";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) {
      const mins = diffMins % 60;
      if (mins === 0) return `${diffHours}h`;
      return `${diffHours}h ${mins}m`;
    }
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Please sign in to view your active sessions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active sessions across different devices and locations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No active sessions found.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.userAgent)}
                    <div>
                      <div className="font-medium">
                        Session {session.id.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created {formatTimeAgo(session.createdAt)}
                      </div>
                      {session.userAgent && (
                        <div className="text-xs text-muted-foreground truncate max-w-48">
                          {session.userAgent.split(' ')[0] || 'Unknown browser'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getLocationBadge(session.ip)}
                    <Badge variant="secondary" className="text-xs">
                      Expires in {formatTimeUntil(session.expiresAt)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={loadSessions} variant="outline" size="sm">
                Refresh
              </Button>
              <Button
                onClick={handleLogoutAll}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout All Sessions
              </Button>
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Sessions are automatically secured with IP and device binding.
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SessionManager;
