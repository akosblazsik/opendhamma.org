// app/vaults/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { AuthStatus } from '@/components/AuthButtons';
import { ArrowLeft, Network } from 'lucide-react';
import { getVaultRegistry } from '@/lib/vaults';

export default function VaultsLayout({ children }: { children: ReactNode }) {
    const vaults = getVaultRegistry();

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar for Vault Navigation */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 p-4 flex flex-col fixed h-full overflow-y-auto">
                <div className="flex items-center space-x-2 mb-6 pt-2">
                    <Network size={24} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Vaults</h2>
                </div>
                <nav className="flex-grow">
                    <ul>
                        {vaults.length > 0 ? vaults.map(vault => (
                            <li key={vault.id} className="mb-1">
                                <Link href={`/vaults/${vault.id}`}
                                    className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
                                    {vault.name} {vault.default ? <span className="text-xs text-green-600 dark:text-green-400">(Default)</span> : ''}
                                </Link>
                            </li>
                        )) : (
                            <li className="text-sm text-gray-500 px-3">No vaults found in registry.</li>
                        )}
                    </ul>
                </nav>
                {/* Add link to Admin Vault Management later? */}
                {/* <div className="mt-auto py-2"> <Link href="/admin/vaults" className="text-sm text-blue-600 hover:underline">Manage Vaults</Link> </div> */}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col ml-64"> {/* Adjust margin to match sidebar width */}
                <header className="sticky top-0 z-10 px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white" title="Back to Home">
                            <ArrowLeft size={20} />
                        </Link>
                        {/* TODO: Add Breadcrumbs specific to the current vault path */}
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">Vault Explorer</span>
                    </div>
                    <AuthStatus />
                </header>
                <main className="flex-grow container mx-auto px-4 py-8">
                    {children}
                </main>
                <footer className="text-center py-4 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                    Browsing GitHub Vaults | Opendhamma
                </footer>
            </div>
        </div>
    );
}