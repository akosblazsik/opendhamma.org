// app/vaults/[vaultId]/[...path]/page.tsx
import { getVaultById } from '@/lib/vaults';
import { getFileContent, getDirectoryContent, GitHubDirectoryContent, GitHubFileContent } from '@/lib/github';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, Folder, Github, ArrowLeft, AlertCircle } from 'lucide-react';

// Removed explicit VaultPageProps interface

// Reusable Markdown Renderer (similar to SuttaPage, could be extracted)
// Prefix unused basePath with _ if ESLint complains, or remove if unneeded
function VaultMarkdownRenderer({ markdownContent, vaultId, basePath: _basePath }: { markdownContent: string, vaultId: string, basePath: string }) {
    // Corrected regex to match standard wiki links [[target]] or [[target|display]]
    const processedMarkdown = markdownContent.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (match, linkTarget, linkDisplay) => {
        const targetSlug = linkTarget.trim().replace(/ /g, '-').toLowerCase();
        const targetPath = targetSlug.endsWith('.md') ? targetSlug : `${targetSlug}.md`; // Basic assumption
        const display = linkDisplay ? linkDisplay.substring(1).trim() : linkTarget.trim(); // Trim display text too
        // Simpler link for now
        return `[${display}](/vaults/${vaultId}/${targetPath})`;
    });

    return (
        // Use prose class from @tailwindcss/typography for styling
        <div className="prose prose-neutral dark:prose-invert max-w-none prose-a:text-primary-600 dark:prose-a:text-primary-400 hover:prose-a:underline">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    a: ({ href, children }) => {
                        if (href?.startsWith('/') && !href.startsWith('//')) {
                            return <Link href={href}>{children}</Link>;
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                    },
                    h1: ({ node: _node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 border-b pb-2 dark:border-darkborder" {...props} />,
                    h2: ({ node: _node, ...props }) => <h2 className="text-2xl font-semibold mt-5 mb-3" {...props} />,
                    code: ({ node: _node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                            <pre className="bg-neutral-100 dark:bg-neutral-900 p-3 rounded overflow-x-auto my-4 border border-border dark:border-darkborder"><code className={`language-${match?.[1]} whitespace-pre-wrap`} {...props}>{children}</code></pre>
                        ) : (
                            <code className="bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                        );
                    },
                }}
            >
                {processedMarkdown}
            </ReactMarkdown>
        </div>
    );
}

// Component to render a directory listing with better styling
function DirectoryListing({ items, vaultId, currentPath }: { items: GitHubDirectoryContent[], vaultId: string, currentPath: string }) {
    const sortedItems = [...items].sort((a, b) => {
        if (a.type === 'dir' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });

    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const showParentLink = currentPath !== '';

    return (
        <div className="border border-border dark:border-darkborder rounded-lg overflow-hidden">
            <ul className="divide-y divide-border dark:divide-darkborder">
                {/* Parent Directory Link */}
                {showParentLink && (
                    <li className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <Link href={`/vaults/${vaultId}/${parentPath}`} className="flex items-center space-x-3 px-4 py-3 text-sm">
                            <ArrowLeft size={18} className="text-neutral-500 flex-shrink-0" />
                            <span className="font-medium text-neutral-600 dark:text-neutral-400">Parent Directory</span>
                        </Link>
                    </li>
                )}
                {/* Directory Items */}
                {sortedItems.map(item => (
                    <li key={item.sha} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <Link href={`/vaults/${vaultId}/${item.path}`} className="flex items-center space-x-3 px-4 py-3 text-sm">
                            {item.type === 'dir'
                                ? <Folder size={18} className="text-yellow-500 flex-shrink-0" />
                                : <FileText size={18} className="text-primary-500 flex-shrink-0" />
                            }
                            <span className="flex-grow truncate font-medium text-foreground">{item.name}</span>
                            {item.type === 'file' && <span className="text-xs text-neutral-500 flex-shrink-0">{(item.size / 1024).toFixed(1)} KB</span>}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}


// --- Main Page Component ---
// Use 'any' as a TEMPORARY WORKAROUND for the props type error
export default async function VaultPathPage(props: any) {
    // Destructure params - this should still work at runtime even with 'any' type
    // Add checks or default values if props or params might be undefined
    const params = props.params || {};
    const { vaultId, path: pathSegments } = params;
    // const searchParams = props.searchParams || {}; // If using searchParams

    // Runtime check for essential params
    if (!vaultId) {
        console.error("Missing vaultId parameter in VaultPathPage props:", props);
        notFound();
    }

    const vault = getVaultById(vaultId);

    if (!vault) {
        notFound(); // Vault not found in registry
    }

    const requestedPath = pathSegments?.join('/') || ''; // Join path segments or use empty string for root
    let fileData: GitHubFileContent | null = null;
    let dirData: GitHubDirectoryContent[] | null = null;
    let errorMsg: string | null = null;
    let resourceUrl: string | null = null; // URL to the GitHub resource

    try {
        // Try fetching as a file first (more specific)
        fileData = await getFileContent(vault.repo, requestedPath);

        if (fileData) {
            resourceUrl = fileData.html_url;
        } else {
            // If not a file, try fetching as a directory
            dirData = await getDirectoryContent(vault.repo, requestedPath);
            if (!dirData) {
                // If neither file nor directory found after trying both
                notFound();
            } else {
                // Construct GitHub directory URL (approximated)
                resourceUrl = `https://github.com/${vault.repo}/tree/main/${requestedPath}`; // Assumes 'main' branch
            }
        }
    } catch (error: any) {
        console.error(`Error fetching vault content for ${vaultId}/${requestedPath}:`, error);
        if (error.status === 404) {
            notFound(); // Explicit 404 from GitHub API
        }
        // Handle other potential errors (rate limits, permissions, etc.)
        errorMsg = `Error loading content from GitHub: ${error.message}. Please check permissions and rate limits.`;
        // We already checked vault exists, so no need to refetch here for error display
    }

    // Define basePath here, used only by VaultMarkdownRenderer if needed
    // Prefix with _ because ESLint warns it's unused otherwise in this scope
    const _basePath = requestedPath.includes('/') ? requestedPath.substring(0, requestedPath.lastIndexOf('/')) : '';
    const pageTitle = fileData ? fileData.name : `/${requestedPath || vault.name}`; // Display file name or path

    // Render Error State
    if (errorMsg) {
        return (
            <div className="p-6 md:p-8 rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 shadow">
                <div className="flex items-center space-x-3 mb-4">
                    <AlertCircle className="text-red-500 dark:text-red-400" size={24} />
                    <h1 className="text-xl font-semibold text-red-700 dark:text-red-300">Error Loading Content</h1>
                </div>
                <p className="text-red-600 dark:text-red-200 mb-2">{errorMsg}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Vault: {vault.name} ({vault.repo})</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Path: /{requestedPath}</p>
            </div>
        )
    }

    // Render Normal Page (File or Directory)
    return (
        <div className="bg-white dark:bg-neutral-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow border border-border dark:border-darkborder">
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-border dark:border-darkborder flex justify-between items-center flex-wrap gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-all">
                    {pageTitle}
                </h1>
                {resourceUrl && (
                    <a href={resourceUrl} target="_blank" rel="noopener noreferrer" title="View on GitHub"
                        className="inline-flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors">
                        <Github size={14} />
                        <span>View on GitHub</span>
                    </a>
                )}
            </div>

            {/* Content Area */}
            <div>
                {/* Render File Content */}
                {fileData && (
                    <>
                        {Object.keys(fileData.data).length > 0 && (
                            <details className="mb-6 p-3 border border-border dark:border-darkborder rounded bg-neutral-50 dark:bg-neutral-900/50 text-xs cursor-pointer group">
                                <summary className="font-semibold text-sm list-none select-none flex justify-between items-center">
                                    <span>View Frontmatter</span>
                                    <span className="text-neutral-400 transition-transform duration-200 ease-out group-open:rotate-90">▼</span>
                                </summary>
                                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">{JSON.stringify(fileData.data, null, 2)}</pre>
                            </details>
                        )}

                        {requestedPath.endsWith('.md') ? (
                            // Pass _basePath even if unused by renderer currently
                            <VaultMarkdownRenderer markdownContent={fileData.content} vaultId={vaultId} basePath={_basePath} />
                        ) : (
                            <pre className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap border border-border dark:border-darkborder">
                                {fileData.content}
                            </pre>
                        )}
                    </>
                )}

                {/* Render Directory Listing */}
                {dirData && (
                    <DirectoryListing items={dirData} vaultId={vaultId} currentPath={requestedPath} />
                )}
            </div>
        </div>
    );
}