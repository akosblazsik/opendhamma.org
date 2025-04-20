'use client';

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image"; // Import Next.js Image
import { LogIn, LogOut, Github } from "lucide-react"; // Import Github icon

export function SignInButton() {
    return (
        <button
            onClick={() => signIn("github")}
            className="flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
            <Github size={16} className="mr-2" />
            Sign in with GitHub
        </button>
    );
}

export function SignOutButton() {
    const { data: session } = useSession();

    return (
        <div className="flex items-center space-x-3">
            {session?.user?.image && (
                // Use Next.js Image component for optimization
                <Image
                    src={session.user.image}
                    alt={session.user.name || 'User avatar'}
                    width={32} // Specify width
                    height={32} // Specify height
                    className="w-8 h-8 rounded-full"
                />
            )}
            <span className="text-sm font-medium hidden md:inline text-gray-700 dark:text-gray-300">{session?.user?.name || session?.user?.email}</span>
            <button
                onClick={() => signOut()}
                className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                title="Sign Out"
            >
                <LogOut size={16} className="hidden sm:inline mr-0 sm:mr-1" />
                <span className="sm:hidden">Sign Out</span> {/* Show text on small screens */}
                <span className="hidden sm:inline">Sign Out</span>
            </button>
        </div>
    );
}

export function AuthStatus() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div className="text-sm text-gray-400 px-4 py-2">Loading...</div>;
    }

    if (session) {
        return <SignOutButton />;
    }

    return <SignInButton />;
}