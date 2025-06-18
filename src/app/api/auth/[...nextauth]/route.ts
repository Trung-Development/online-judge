import NextAuth, { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: User;
  }

  interface User {
    id: string;
    email: string;
    username: string;
    fullname: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id: string;
    email: string;
    username: string;
    fullname: string;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        // 1. Get JWT from /client/sessions/
        const sessionRes = await fetch(
          `${process.env.API_ENDPOINT}/client/sessions/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          }
        );

        if (!sessionRes.ok) return null;
        const sessionData = await sessionRes.json();
        const token = sessionData.data;

        if (!token) return null;

        // 2. Get user data from /client/users/me using the JWT
        const userRes = await fetch(
          `${process.env.API_ENDPOINT}/client/users/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!userRes.ok) return null;
        const userData = await userRes.json();

        // 3. Return a complete user object for the JWT callback
        return {
          ...userData,
          accessToken: token,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // The `user` object is from `authorize` on sign-in
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.fullname = user.fullname;
      }
      return token;
    },
    // The `token` object is from `jwt`
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.username = token.username;
      session.user.fullname = token.fullname;
      return session;
    },
  },
  pages: {
    signIn: "/accounts/login", // your custom login page
  },
});

export { handler as GET, handler as POST };