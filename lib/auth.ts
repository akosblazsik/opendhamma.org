// lib/auth.ts

import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

// Define and export auth options from here
export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            // Ensure environment variables are correctly typed or checked
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
            // V4 authorization scope configuration (if needed)
            // authorization: {
            //   params: { scope: "read:user user:email repo" },
            // },
        }),
        // Add other providers if needed
    ],
    // V4 requires the secret directly in the options
    secret: process.env.AUTH_SECRET,

    // Session strategy (jwt is default and recommended)
    session: {
        strategy: "jwt",
    },

    // Add callbacks if needed
    callbacks: {
        // Example callbacks (adjust as necessary)
        // async jwt({ token, user, account, profile }) { ... },
        // async session({ session, token }) { ... },
    },

    // Add custom pages if needed
    // pages: {
    //   signIn: '/auth/signin',
    //   error: '/auth/error',
    // },

    // Enable debug logs only in development
    debug: process.env.NODE_ENV === 'development',
};

// Optional: Export server-side session helper pre-configured with options
// import { getServerSession as getSession } from "next-auth/next"
// export function getServerSession() {
//   return getSession(authOptions);
// }