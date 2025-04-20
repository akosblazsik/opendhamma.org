// app/api/auth/[...nextauth]/route.ts - Updated for NextAuth v4

import NextAuth, { type NextAuthOptions } from "next-auth"; // Import NextAuthOptions for typing
import GithubProvider from "next-auth/providers/github"; // Import provider correctly for v4

// --- BEGIN DEBUG LOGS ---
// Keep these for now to ensure env vars are still loaded
console.log("--- Loading NextAuth v4 Route Handler ---");
console.log("GITHUB_ID:", process.env.GITHUB_ID ? "Loaded" : "MISSING or Empty");
console.log("GITHUB_SECRET:", process.env.GITHUB_SECRET ? "Loaded" : "MISSING or Empty");
console.log("AUTH_SECRET:", process.env.AUTH_SECRET ? "Loaded" : "MISSING or Empty");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
// --- END DEBUG LOGS ---

// Define auth options separately for clarity
export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({ // Use GithubProvider import
            clientId: process.env.GITHUB_ID as string, // Assert as string or check existence
            clientSecret: process.env.GITHUB_SECRET as string, // Assert as string or check existence
            // V4 authorization scope configuration (if needed)
            // authorization: {
            //   params: { scope: "read:user user:email repo" },
            // },
        }),
        // Add other providers here if needed
    ],
    // V4 requires the secret directly in the options
    secret: process.env.AUTH_SECRET,

    // Session strategy (jwt is default and recommended)
    session: {
        strategy: "jwt",
    },

    // Add callbacks if needed (syntax might differ slightly from v5 examples)
    callbacks: {
        // async jwt({ token, user, account, profile }) {
        //   // Example: Persist github login or user id to the token
        //   if (account && user) {
        //     token.accessToken = account.access_token;
        //     token.id = user.id;
        //     // token.login = (profile as any)?.login; // Need to cast profile if using it
        //   }
        //   return token;
        // },
        // async session({ session, token }) {
        //   // Example: Add custom properties from token to session
        //   // session.accessToken = token.accessToken;
        //   // if (token.id) session.user.id = token.id as string;
        //   // if (token.login) (session.user as any).login = token.login; // Need casting or type extension
        //   return session;
        // },
    },

    // Add custom pages if needed
    // pages: {
    //   signIn: '/auth/signin',
    //   error: '/auth/error', // Custom error page
    // },

    // Debugging for v4
    debug: process.env.NODE_ENV === 'development',
};

// Create the handler using the options - V4 pattern for App Router involves named exports again!
// Correction: Even for v4 in App Router, named exports GET/POST seem preferred now.
// Let's use the pattern recommended in some v4 App Router examples.
const handler = NextAuth(authOptions);

// Export named handlers for App Router compatibility (even with v4)
export { handler as GET, handler as POST };

// Note: The `getServerSession` helper from `next-auth/next` would be used
// server-side to get the session in v4, often with `authOptions` passed to it.
// Client-side remains similar with `useSession`, `signIn`, `signOut` from `next-auth/react`.