# Session Management Implementation

This document describes the implementation of session validation and logout functionality for the YACPS-OJ frontend.

## Overview

The session management system provides:

1. **Automatic session validation** - Periodically checks if the session is still valid on the backend
2. **Automatic logout on session expiry** - Signs out users when their session becomes invalid
3. **Backend session cleanup** - Deletes sessions from the backend when users log out
4. **Authenticated API utilities** - Helper functions for making authenticated API calls

## Components

### 1. Session Validation Hook (`src/hooks/use-session-validation.ts`)

Provides session validation and logout functionality:

```typescript
import { useSessionValidation } from "@/hooks/use-session-validation";

function MyComponent() {
  const { validateSession, logout } = useSessionValidation();

  // Manual session validation
  const handleCheckSession = async () => {
    const isValid = await validateSession();
    if (!isValid) {
      console.log("Session expired");
    }
  };

  // Manual logout
  const handleLogout = () => {
    logout();
  };
}
```

### 2. Session Validator Component (`src/components/SessionValidator.tsx`)

Automatically validates sessions at regular intervals:

```typescript
import SessionValidator from "@/components/SessionValidator";

// Validates session every minute (default)
<SessionValidator>
  <YourApp />
</SessionValidator>

// Custom validation interval (30 seconds)
<SessionValidator validationIntervalMs={30000}>
  <YourApp />
</SessionValidator>
```

### 3. Authenticated API Utilities (`src/lib/api.ts`)

Helper functions for making authenticated API calls with automatic session handling:

```typescript
import { authenticatedFetch, apiCall } from "@/lib/api";

// Basic authenticated fetch
const response = await authenticatedFetch("/api/endpoint");

// Authenticated fetch with options
const response = await authenticatedFetch("/api/endpoint", {
  method: "POST",
  body: { data: "example" },
  autoLogout: true, // Auto logout on 401 (default: true)
});

// Typed API call that automatically handles JSON response
const data = await apiCall<MyDataType>("/api/endpoint", {
  method: "GET",
});
```

## How It Works

### Login Process

1. User submits credentials via NextAuth
2. NextAuth calls the backend `/client/sessions/` endpoint to create a session
3. Backend returns a JWT token
4. NextAuth stores the token in the session object
5. User data is fetched from `/client/users/me` using the JWT

### Logout Process

1. User clicks logout or `logout()` function is called
2. NextAuth `signOut` event is triggered
3. The event handler calls `DELETE /client/sessions/me` to delete the backend session
4. NextAuth clears the local session
5. User is redirected to login page

### Session Validation

1. `SessionValidator` component starts periodic validation after 5 seconds
2. Every minute (configurable), it calls `/client/users/me` with the stored JWT
3. If the API returns 401 Unauthorized:
   - The session is considered expired/invalid
   - `signOut()` is called automatically (without backend DELETE since session is already invalid)
   - User is redirected to login page

### Error Handling

- **Network errors**: Logged but don't trigger logout (user might be temporarily offline)
- **401 Unauthorized**: Triggers automatic logout
- **Other HTTP errors**: Handled by the specific API call logic

## Backend Integration

The system integrates with these backend endpoints:

- `POST /client/sessions/` - Create session (login)
- `DELETE /client/sessions/me` - Delete current session (logout)
- `GET /client/users/me` - Get current user (session validation)

Backend responses:

- **401 Unauthorized**: Session expired/invalid/not found
- **200 OK**: Session is valid

## Configuration

Environment variables required:

- `API_ENDPOINT` - Backend API base URL (server-side)
- `NEXT_PUBLIC_API_ENDPOINT` - Backend API base URL (client-side)

## Security Considerations

1. **Session tokens** are stored in NextAuth JWT and automatically included in API calls
2. **Automatic logout** prevents users from accessing protected resources with expired sessions
3. **Backend cleanup** ensures sessions are properly deleted from the database
4. **Periodic validation** catches session expiry even when user is idle
5. **Network error handling** prevents false logouts due to temporary connectivity issues

## Usage Examples

### Protected Page

```typescript
"use client";

import { useSession } from "next-auth/react";
import { apiCall } from "@/lib/api";
import { useEffect, useState } from "react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (status === "authenticated") {
      // This will automatically handle session validation
      apiCall("/client/problems")
        .then(setData)
        .catch(console.error);
    }
  }, [status]);

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Please login</div>;

  return <div>Protected content: {JSON.stringify(data)}</div>;
}
```

### Manual Session Check

```typescript
import { useSessionValidation } from "@/hooks/use-session-validation";

function MyComponent() {
  const { validateSession, logout } = useSessionValidation();

  const handleSensitiveAction = async () => {
    // Validate session before performing sensitive action
    const isValid = await validateSession();
    if (!isValid) {
      alert("Your session has expired. Please login again.");
      return;
    }

    // Proceed with action
    // ...
  };
}
```
