// app/vaults/[vaultId]/page.tsx
// This page handles the root view of a specific vault (e.g., /vaults/vault-id)

import { getVaultById } from '@/lib/vaults';
import { getDirectoryContent, GitHubDirectoryContent } from '@/lib/github';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Folder, FileText, Github, ArrowLeft, AlertCircle } from 'lucide-react';

// Re-usable DirectoryListing component (modified for vault root display)
// Note: Extracting this to a separate component file (e.g., components/VaultDirectoryListing.tsx) is recommended.
function DirectoryListing({ items, vaultId, vaultBasePath }: { items: GitHubDirectoryContent[], vaultId: string, vaultBasePath: string | undefined }) {
    const sortedItems = [...items].sort((a, b) => {
        if (a.type === 'dir' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });

    // Parent link for root directory goes back to the main vaults index
    const parentDisplayPath = '/vaults';

    return (
        <div className="border border-border dark:border-darkborder rounded-lg overflow-hidden bg-white dark:bg-neutral-800/50 shadow-sm">
            <ul className="divide-y divide-border dark:divide-darkborder">
                {/* Parent Directory Link */}
                <li className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <Link href={parentDisplayPath} className="flex items-center space-x-3 px-4 py-3 text-sm">
                        <ArrowLeft size={18} className="text-neutral-500 flex-shrink-0" />
                        <span className="font-medium text-neutral-600 dark:text-neutral-400">All Vaults</span>
                    </Link>
                </li>
                {/* Directory Items */}
                {sortedItems.map(item => {
                    // Path for link should be relative to vault display root
                    // We strip the repo's basePath from the item.path returned by GitHub API
                    // to get the path relative to the vault's logical root.
                    let itemDisplayPath = item.path;
                    if (vaultBasePath && item.path.startsWith(vaultBasePath + '/')) {
                        itemDisplayPath = item.path.substring(vaultBasePath.length + 1);
                    } else if (vaultBasePath && item.path === vaultBasePath) {
                        // Should not happen if API returns items within basePath, but safeguard
                        itemDisplayPath = ''; // Path is the base path itself? Unlikely.
                    }
                    // Handle potential double slashes if basePath is empty
                    itemDisplayPath = itemDisplayPath.replace(/^\/+/, '');

                    return (
                        <li key={item.sha} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                            {/* Link uses the calculated display path */}
                            <Link href={`/vaults/${vaultId}/${itemDisplayPath}`} className="flex items-center space-x-3 px-4 py-3 text-sm">
                                {item.type === 'dir'
                                    ? <Folder size={18} className="text-yellow-500 flex-shrink-0" />
                                    : <FileText size={18} className="text-primary-500 flex-shrink-0" />
                                }
                                <span className="flex-grow truncate font-medium text-foreground">{item.name}</span>
                                {item.type === 'file' && <span className="text-xs text-neutral-500 flex-shrink-0">{(item.size / 1024).toFixed(1)} KB</span>}
                            </Link>
                        </li>
                    );
                })}
            </ul>
            {items.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-neutral-500 italic">This vault directory appears to be empty.</p>
            )}
        </div>
    );
}


// --- Main Vault Root Page Component ---
export default async function VaultRootPage({ params }: { params: { vaultId: string } }) {
    // Access params.vaultId directly to avoid Next.js warning
    let vault;
    let dirData: GitHubDirectoryContent[] | null = null;
    let errorMsg: string | null = null;
    let resourceUrl: string | null = null; // URL to the GitHub vault root

    try {
        // Use params.vaultId directly here
        vault = getVaultById(params.vaultId);
        if (!vault) {
            notFound(); // Vault not found in registry
        }

        // Fetch directory content for the vault's root (passing empty string "" for dirPath)
        dirData = await getDirectoryContent(vault.repo, "", vault.basePath, undefined); // Pass vault.basePath

        if (!dirData) {
            // Handle case where basePath might be wrong or repo inaccessible, but vault exists in config
            errorMsg = `Could not list directory contents for vault root. Check repository access or basePath ('${vault.basePath || '/'}').`;
            // Attempt to construct URL even if content fetch failed, for user reference
            const fullRepoPath = [vault.basePath].filter(Boolean).join('/');
            resourceUrl = `https://github.com/${vault.repo}/tree/main/${fullRepoPath}`;
        } else {
            // Construct GitHub root directory URL if fetch succeeded
            const fullRepoPath = [vault.basePath].filter(Boolean).join('/');
            resourceUrl = `https://github.com/${vault.repo}/tree/main/${fullRepoPath}`; // Assumes 'main' branch
        }

    } catch (error: any) {
        // Use params.vaultId directly in error log
        console.error(`Error fetching vault root content for ${params.vaultId}:`, error);
        errorMsg = `Error loading content from GitHub: ${error.message}.`;
        if (error.status === 404) notFound(); // Can happen if repo itself is gone
        // Try to get vault info again for error display if vault wasn't set before error
        if (!vault) vault = getVaultById(params.vaultId);
    }


    // --- Render Logic ---

    // Render Error State First
    if (errorMsg && !dirData) { // Show error only if directory data couldn't be loaded
        return (
            <div className="p-6 md:p-8 rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 shadow">
                <div className="flex items-center space-x-3 mb-4">
                    <AlertCircle className="text-red-500 dark:text-red-400" size={24} />
                    <h1 className="text-xl font-semibold text-red-700 dark:text-red-300">Error Loading Vault Root</h1>
                </div>
                <p className="text-red-600 dark:text-red-200 mb-2">{errorMsg}</p>
                {/* Ensure vault exists before accessing properties */}
                {vault && (
                    <>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Vault: {vault.name} ({vault.repo})</p>
                        {resourceUrl && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Attempted Path: <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{resourceUrl}</a></p>}
                    </>
                )}
            </div>
        );
    }

    // Safeguard if vault somehow became undefined after try/catch without errorMsg
    if (!vault) {
        notFound();
    }

    // Render Directory Listing if successful (or if error occurred but dirData was fetched before error)
    return (
        // Removed outer container div, assuming layout provides padding
        <>
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-border dark:border-darkborder flex justify-between items-center flex-wrap gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-all">
                    {vault.name}
                    <span className="text-lg font-normal text-neutral-500 dark:text-neutral-400 ml-2">(Root Directory)</span>
                </h1>
                {resourceUrl && (
                    <a href={resourceUrl} target="_blank" rel="noopener noreferrer" title={`View ${vault.basePath || 'root'} on GitHub`} className="inline-flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors">
                        <Github size={14} />
                        <span>View on GitHub</span>
                    </a>
                )}
            </div>

            {/* Content Area - Directory Listing */}
            {dirData ? (
                <DirectoryListing items={dirData} vaultId={params.vaultId} currentPath={vault.basePath ?? ''} vaultBasePath={vault.basePath} />
            ) : (
                // This case should ideally be covered by the error block above
                <p className="text-neutral-500 italic">Could not load directory contents.</p>
            )}
        </>
    );
}