import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const isProd = process.env.NODE_ENV === "production";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge:    30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,      // refresh token every 24 h
  },
  cookies: {
    sessionToken: {
      // __Secure- prefix is required when secure: true (browser spec)
      name: isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,           // not accessible via JS
        sameSite: "lax" as const, // CSRF protection, allows OAuth redirects
        path: "/",
        secure: isProd,           // HTTPS only in production
      },
    },
    callbackUrl: {
      name: isProd ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        sameSite: "lax" as const,
        path: "/",
        secure: isProd,
      },
    },
    csrfToken: {
      // CSRF token does not need httpOnly — it is read by JS for form submissions
      name: isProd ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProd,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id;
        token.image = user.image;   // Google profile picture URL
        token.name  = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id    = token.id as string;
        session.user.image = token.image as string | null | undefined;
        session.user.name  = token.name as string | null | undefined;
      }
      return session;
    },
  },
});
