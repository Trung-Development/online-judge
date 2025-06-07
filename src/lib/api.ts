"use client";

export interface ApiCallOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  autoLogout?: boolean; // Whether to automatically logout on 401
}

export async function publicFetchWithAuthentication(
  url: string,
  options: ApiCallOptions = {},
): Promise<Response> {
  const { method = "GET", headers = {}, body, autoLogout = true } = options;

  // Get current session
  const sessionResponse = await fetch("/api/auth/session");
  const sessionData = sessionResponse.ok ? await sessionResponse.json() : null;
  const isLoggedIn = !!sessionData?.sessionToken;

  // Add authorization header and User Agent if logged in
  const authHeaders: Record<string, string> = {
    ...headers,
    "X-User-Agent": navigator.userAgent, // Send the original browser User Agent
  };
  if (isLoggedIn)
    authHeaders.Authorization = `Bearer ${sessionData.sessionToken}`;

  // Add content-type for POST/PUT requests with body
  if (body && !headers["Content-Type"]) {
    authHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers: authHeaders,
    body: body
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  // Handle 401 Unauthorized responses only if the user is logged in
  if (
    isLoggedIn &&
    response.status === 401 &&
    autoLogout &&
    (await response.json()).message === "INVALID_TOKEN"
  ) {
    console.log("Session expired during API call, signing out");
    // Clear the session by calling logout endpoint
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/accounts/login";
    throw new Error("Session expired");
  }

  return response;
}

export async function authenticatedFetch(
  url: string,
  options: ApiCallOptions = {},
): Promise<Response> {
  const { method = "GET", headers = {}, body, autoLogout = true } = options;

  // Get the current session
  const sessionResponse = await fetch("/api/auth/session");
  if (!sessionResponse.ok) {
    throw new Error("No valid session found");
  }

  const sessionData = await sessionResponse.json();
  if (!sessionData?.sessionToken) {
    throw new Error("No valid session found");
  }

  // Add authorization header and User Agent
  const authHeaders: Record<string, string> = {
    ...headers,
    Authorization: `Bearer ${sessionData.sessionToken}`,
    "X-User-Agent": navigator.userAgent, // Send the original browser User Agent
  };

  // Add content-type for POST/PUT requests with body
  if (body && !headers["Content-Type"]) {
    authHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers: authHeaders,
    body: body
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  // Handle 401 Unauthorized responses
  if (response.status === 401 && autoLogout) {
    console.log("Session expired during API call, signing out");
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/accounts/login";
    throw new Error("Session expired");
  }

  return response;
}

export async function apiCall<T = unknown>(
  url: string,
  options: ApiCallOptions = {},
): Promise<T> {
  const response = await authenticatedFetch(url, options);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(
      errorData.message || `API call failed with status ${response.status}`,
    );
  }

  return response.json();
}
