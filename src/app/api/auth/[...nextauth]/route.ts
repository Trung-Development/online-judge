import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    user: {
      id: string;
      email: string;
      username: string;
      fullname: string;
    };
  }

  interface User {
    id: string;
    email: string;
    username: string;
    fullname: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    id: string;
    email: string;
    username: string;
    fullname: string;
    accessTokenExpires?: number;
  }
}

function buildApiUrl(path: string): string {
  return new URL(path, process.env.API_ENDPOINT).toString();
}

async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch(
      buildApiUrl("/client/sessions/refresh"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: token.refreshToken,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const refreshedTokens = await response.json();
    const tokenData = refreshedTokens.data;

    return {
      ...token,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userAgent: { label: "User Agent", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          // 1. Get JWT from /client/sessions/
          const sessionRes = await fetch(
            new URL("/client/sessions/", process.env.API_ENDPOINT).toString(),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
                userAgent: credentials.userAgent,
              }),
            },
          );

          if (!sessionRes.ok) {
            const errorBody = await sessionRes.json();
            if (errorBody.message === "INCORRECT_CREDENTIALS") {
              throw new Error("Incorrect email or password. Please try again.");
            }
            // Handle other potential backend errors
            throw new Error(
              errorBody.message || "An authentication error occurred.",
            );
          }

          const sessionData = await sessionRes.json();
          const tokenData = sessionData.data;

          if (!tokenData?.accessToken || !tokenData?.refreshToken) {
            throw new Error("Authentication failed: No tokens received.");
          }

          // 2. Get user data from /client/users/me using the access token
          const userRes = await fetch(
            new URL("/client/users/me", process.env.API_ENDPOINT).toString(),
            {
              headers: { Authorization: `Bearer ${tokenData.accessToken}` },
            },
          );

          if (!userRes.ok) {
            throw new Error("Failed to fetch user data after login.");
          }
          const userData = await userRes.json();

          // 3. Return a complete user object for the JWT callback
          return {
            ...userData,
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
          };
        } catch (e) {
          // This will catch both network errors and the errors thrown above.
          // NextAuth will pass the error message to the client.
          if (e instanceof Error) {
            throw e;
          }
          throw new Error(
            "An unexpected error occurred during authentication.",
          );
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // The `user` object is from `authorize` on sign-in
    async jwt({ token, user, trigger }) {
      if (user) {
        // This only happens on initial sign-in
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.fullname = user.fullname;
        // Set access token expiry (15 minutes from now)
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000;
        return token; // Return early for initial login
      }

      // For subsequent requests, check if access token needs refresh
      // Only refresh if we're close to expiry (5 minutes before) to avoid constant refreshing
      const now = Date.now();
      const expiresAt = token.accessTokenExpires;
      const timeUntilExpiry = expiresAt ? expiresAt - now : 0;
      
      // Only refresh if less than 5 minutes remaining or already expired
      if (token.accessTokenExpires && timeUntilExpiry > 5 * 60 * 1000) {
        return token;
      }

      // Try to refresh the access token
      return await refreshAccessToken(token);
    },
    // The `token` object is from `jwt`
    async session({ session, token }) {
      // Check for token refresh errors
      if (token.error === 'RefreshAccessTokenError') {
        // Force re-authentication
        session.error = 'RefreshAccessTokenError';
      }

      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.username = token.username;
      session.user.fullname = token.fullname;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      // Delete the session from the backend when signing out
      if (token?.accessToken) {
        try {
          await fetch(new URL("/client/sessions/logout", process.env.API_ENDPOINT).toString(), {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token.accessToken}` },
          });
        } catch (error) {
          console.error("Failed to delete session on backend:", error);
          // Don't throw error here as we still want to complete the logout
        }
      }
    },
  },
  pages: {
    signIn: "/accounts/login", // your custom login page
  },
});

export { handler as GET, handler as POST };
