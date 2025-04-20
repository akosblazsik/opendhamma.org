// app/vaults/page.tsx
// Page to list available vaults from the registry
import Link from 'next/link';
import { getVaultRegistry } from '@/lib/vaults';
import { Github, Rss } from 'lucide-react'; // Added Github

export default function VaultsIndexPage() {
    const vaults = getVaultRegistry();

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Available Vaults</h1>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
                Select a vault from the sidebar to browse its contents. Vaults are GitHub repositories containing Markdown notes and documents, registered in `data/vaults.yaml`.
            </p>
            {vaults.length === 0 ? (
                <p className="text-red-500">No vaults found in the registry (`data/vaults.yaml`). Please check the file or server logs.</p>
            ) : (
                <div className="space-y-4">
                    {vaults.map(vault => (
                        <div key={vault.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start flex-wrap gap-x-4 gap-y-2">
                                <div>
                                    <Link href={`/vaults/${vault.id}`} className="text-xl font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                        {vault.name}
                                    </Link>
                                    {vault.default && <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full align-middle">Default</span>}
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{vault.id}</code></p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                                        <Github size={14} />
                                        <span>Repo:</span>
                                        <a href={`https://github.com/${vault.repo}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{vault.repo}</a>
                                    </p>
                                </div>
                                <div className="text-right text-xs text-gray-400 flex-shrink-0">
                                    {vault.readonly ? 'Read-only' : 'Writable (via PRs)'}
                                    {vault.languages && vault.languages.length > 0 && (
                                        <p>Languages: {vault.languages.join(', ')}</p>
                                    )}
                                </div>
                            </div>
                            {vault.topics && vault.topics.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Topics:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {vault.topics.map(topic => (
                                            <span key={topic} className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">{topic}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {/* Link to admin/settings page to add/manage vaults (for authorized users) */}
            {/* <div className="mt-8"> <Link href="/admin/vaults" className="text-blue-600 hover:underline">Manage Vaults (Admin)</Link> </div> */}
        </div>
    );
}