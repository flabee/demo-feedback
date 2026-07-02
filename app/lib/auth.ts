import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { COMPANY_EMAIL_DOMAIN } from "@/lib/config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: { signIn: "/signin" },
  callbacks: {
    // Only verified Google accounts may sign in. When COMPANY_EMAIL_DOMAIN is
    // set, logins are additionally restricted to that domain.
    signIn({ profile }) {
      if (profile?.email_verified !== true) return false;
      if (!COMPANY_EMAIL_DOMAIN) return true;
      const email = (profile.email ?? "").toLowerCase();
      return email.endsWith("@" + COMPANY_EMAIL_DOMAIN);
    },
    // Guard /dashboard: unauthenticated users get redirected to /signin.
    authorized({ auth, request }) {
      const onDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      if (onDashboard) return !!auth?.user;
      return true;
    },
  },
});
