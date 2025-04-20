// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Import shared authOptions

// Create the handler using the imported options
const handler = NextAuth(authOptions);

// Export named handlers for App Router compatibility
export { handler as GET, handler as POST };