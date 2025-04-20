// lib/auth.ts

import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

// Define and export auth options from here
export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
        }),
        // Add other providers if needed
    ],
    secret: process.env.AUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        // Add callbacks if/when needed
    },
    pages: {
        // Add custom pages if/when needed
    },
    debug: process.env.NODE_ENV === 'development',
};

// You can potentially add helper functions related to auth here later