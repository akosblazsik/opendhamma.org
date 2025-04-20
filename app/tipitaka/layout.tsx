// app/tipitaka/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { AuthStatus } from '@/components/AuthButtons';
import { ArrowLeft } from 'lucide-react';

export default function TipitakaLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
            <header className="sticky top-0 z-10 px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <Link href="/tipitaka">
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">Tipitaka Explorer</span>
                    </Link>
                    {/* Add Breadcrumbs or Nikaya links here */}
                </div>
                <AuthStatus />
            </header>
            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>
            <footer className="text-center py-4 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                Content sourced from the default Opendhamma vault.
            </footer>
        </div>
    );
}