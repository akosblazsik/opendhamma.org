// app/admin/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth/next"; // Import v4 server session helper
import { authOptions } from "@/lib/auth";        // Import the options object from lib
import { redirect } from "next/navigation";

// Basic admin check - replace with actual role-based logic later
async function isAdmin(session: any): Promise<boolean> {
    // Example: Check if user email matches a list of admin emails
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(',');
    // Use optional chaining for safety
    return session?.user?.email ? adminEmails.includes(session.user.email) : false;
}

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions); // Use v4 helper with imported options

    if (!session || !(await isAdmin(session))) {
        // Redirect non-admins or unauthenticated users
        redirect('/'); // Redirect to home page for now
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <p className="mb-4">Welcome, Admin! This area provides tools for managing the Opendhamma application.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">Vault Management</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Manage the list of registered vaults, set the default vault.</p>
                    <Link href="/admin/vaults" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Go to Vault Management
                    </Link>
                </div>
                <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-2">User Management</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">(Placeholder) View users, manage roles.</p>
                    {/* <Link href="/admin/users" className="text-blue-600 dark:text-blue-400 hover:underline">Go to User Management</Link> */}
                    <span className="text-gray-400 italic">Not implemented</span>
                </div>
                {/* Add more admin sections as needed */}
            </div>
        </div>
    );
}