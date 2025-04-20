// app/app/settings/page.tsx
import { getServerSession } from "next-auth/next" // Import v4 server session helper
import { authOptions } from "@/lib/auth";
import { AuthStatus, SignInButton } from "@/components/AuthButtons"; // Import SignInButton too

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">User Settings</h1>

            {!session ? (
                <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
                    <p className="mb-4 text-gray-700 dark:text-gray-300">Please sign in to manage your application settings.</p>
                    <SignInButton />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
                        <h2 className="text-xl font-semibold mb-3">Account Information</h2>
                        <p className="mb-2">Welcome, <strong>{session.user?.name || session.user?.email || 'User'}</strong>!</p>
                        {session.user?.email && <p className="text-sm text-gray-600 dark:text-gray-400">Email: {session.user.email}</p>}
                        <div className="mt-4">
                            <AuthStatus /> {/* Allows signing out */}
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
                        <h2 className="text-xl font-semibold mb-3">Preferences</h2>
                        <p className="text-gray-500 italic">(Placeholder) Options like preferred translation languages, theme settings, etc., will appear here.</p>
                        {/* Add settings options here: */}
                        {/* - Preferred languages dropdown */}
                        {/* - Theme selector (light/dark/system) */}
                    </div>

                    <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
                        <h2 className="text-xl font-semibold mb-3">Personal Vaults</h2>
                        <p className="text-gray-500 italic">(Placeholder) Link and manage your personal GitHub repositories as knowledge vaults.</p>
                        {/* - Button to "Link New Vault" (OAuth flow?) */}
                        {/* - List of linked personal vaults */}
                    </div>

                    <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow">
                        <h2 className="text-xl font-semibold mb-3">API Keys</h2>
                        <p className="text-gray-500 italic">(Placeholder) Manage API keys for integrations like OpenAI.</p>
                        {/* - Input fields for API keys */}
                    </div>
                </div>
            )}
        </div>
    );
}