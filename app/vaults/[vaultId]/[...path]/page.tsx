// app/vaults/[vaultId]/[...path]/page.tsx
import { getVaultById } from '@/lib/vaults';
import { getFileContent, getDirectoryContent, GitHubDirectoryContent, GitHubFileContent } from '@/lib/github';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, Folder, Github, ArrowLeft, AlertCircle } from 'lucide-react';

// Markdown Renderer Component (copied from sutta page for consistency)
function VaultMarkdownRenderer({ markdownContent, vaultId, basePath: _basePath }: { markdownContent: string, vaultId: string, basePath: string }) {
    const processedMarkdown = markdownContent.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (match, linkTarget, linkDisplay) => {
        const targetSlug = linkTarget.trim().replace(/ /g, '-').toLowerCase();
        const targetPath = targetSlug.endsWith('.md') ? targetSlug : `${targetSlug}.md`;
        const display = linkDisplay ? linkDisplay.substring(1).trim() : linkTarget.trim();
        return `[${display}](/vaults/${vaultId}/${targetPath})`;
    });

    return (
        <div className="prose prose-neutral dark:prose-invert max-w-none prose-a:text-primary-600 dark:prose-a:text-primary-400 hover:prose-a:underline">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    a: ({ href, children }) => {
                        if (href?.startsWith('/') && !href.startsWith('//')) { return <Link href={href}>{children}</Link>; }
                        return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                    },
                    h1: ({ node: _node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 border-b pb-2 dark:border-darkborder" {...props} />,
                    h2: ({ node: _node, ...props }) => <h2 className="text-2xl font-semibold mt-5 mb-3" {...props} />,
                    code: ({ node: _node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                            <pre className="bg-neutral-100 dark:bg-neutral-900 p-3 rounded overflow-x-auto my-4 border border-border dark:border-darkborder"><code className={`language-${match?.[1]} whitespace-pre-wrap`} {...props}>{children}</code></pre>
                        ) : (
                            <code className="bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                        );
                    },
                }}
            >{processedMarkdown}</ReactMarkdown>
        </div>
    );
}

// Directory Listing Component (copied from previous version)
function DirectoryListing({ items, vaultId, currentPath, vaultBasePath }: { items: GitHubDirectoryContent[], vaultId: string, currentPath: string, vaultBasePath: string | undefined }) {
    const sortedItems = [...items].sort((a, b) => {
        if (a.type === 'dir' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });

    // Calculate parent path relative to the vault display root
    const displayCurrentPath = currentPath.startsWith(vaultBasePath ?? '____')
        ? currentPath.substring((vaultBasePath?.length ?? 0) + 1)
        : currentPath;

    const parentDisplayPath = displayCurrentPath.includes('/') ? displayCurrentPath.substring(0, displayCurrentPath.lastIndexOf('/')) : '';
    const showParentLink = displayCurrentPath !== '';


    return (
        <div className="border border-border dark:border-darkborder rounded-lg overflow-hidden">
            <ul className="divide-y divide-border dark:divide-darkborder">
                {showParentLink && (
                    <li className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        {/* Link uses the display parent path */}
                        <Link href={`/vaults/${vaultId}/${parentDisplayPath}`} className="flex items-center space-x-3 px-4 py-3 text-sm">
                            <ArrowLeft size={18} className="text-neutral-500 flex-shrink-0" />
                            <span className="font-medium text-neutral-600 dark:text-neutral-400">Parent Directory</span>
                        </Link>
                    </li>
                )}
                {sortedItems.map(item => {
                    // Path for link should be relative to vault display root
                    const itemDisplayPath = item.path.startsWith(vaultBasePath ?? '____')
                        ? item.path.substring((vaultBasePath?.length ?? 0) + 1)
                        : item.path;
                    return (
                        <li key={item.sha} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                            {/* Link uses the display path */}
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
        </div>
    );
}


// --- Main Vault Page Component ---
// Use 'any' as a TEMPORARY WORKAROUND for the props type error
export default async function VaultPathPage(props: any) {
    const params = props.params || {};
    const { vaultId, path: pathSegments } = params;

    if (!vaultId) {
        notFound();
    }

    const vault = getVaultById(vaultId);
    if (!vault) {
        notFound();
    }

    // Path requested in the URL, relative to the vault display root
    const requestedDisplayPath = pathSegments?.join('/') || '';

    let fileData: GitHubFileContent | null = null;
    let dirData: GitHubDirectoryContent[] | null = null;
    let errorMsg: string | null = null;
    let resourceUrl: string | null = null;

    try {
        // Try fetching as a file first, using the vault's basePath
        fileData = await getFileContent(vault.repo, requestedDisplayPath, vault.basePath, undefined); // Pass basePath

        if (fileData) {
            resourceUrl = fileData.html_url;
        } else {
            // If not a file, try fetching as a directory, using the vault's basePath
            dirData = await getDirectoryContent(vault.repo, requestedDisplayPath, vault.basePath, undefined); // Pass basePath
            if (!dirData) {
                notFound();
            } else {
                // Construct GitHub directory URL using the actual repo path
                const fullRepoPath = [vault.basePath, requestedDisplayPath].filter(Boolean).join('/');
                resourceUrl = `https://github.com/${vault.repo}/tree/main/${fullRepoPath}`; // Assumes 'main' branch
            }
        }
    } catch (error: any) {
        console.error(`Error fetching vault content for ${vaultId}/${requestedDisplayPath}:`, error);
        if (error.status === 404) {
            notFound();
        }
        errorMsg = `Error loading content from GitHub: ${error.message}. Please check permissions and rate limits.`;
    }

    // Base path for markdown links is relative to the file's *display* directory
    const markdownBasePath = requestedDisplayPath.includes('/') ? requestedDisplayPath.substring(0, requestedDisplayPath.lastIndexOf('/')) : '';
    // Page title uses file name or the display path
    const pageTitle = fileData ? fileData.name : `/${requestedDisplayPath || vault.name}`;

    // --- Render Logic ---

    if (errorMsg) {
        return (<div className="p-6 md:p-8 rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 shadow"> <div className="flex items-center space-x-3 mb-4"> <AlertCircle className="text-red-500 dark:text-red-400" size={24} /> <h1 className="text-xl font-semibold text-red-700 dark:text-red-300">Error Loading Content</h1> </div> <p className="text-red-600 dark:text-red-200 mb-2">{errorMsg}</p> <p className="text-sm text-neutral-500 dark:text-neutral-400">Vault: {vault.name} ({vault.repo})</p> <p className="text-sm text-neutral-500 dark:text-neutral-400">Path: /{requestedDisplayPath}</p> </div>);
    }

    return (
        <div className="bg-white dark:bg-neutral-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow border border-border dark:border-darkborder">
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-border dark:border-darkborder flex justify-between items-center flex-wrap gap-2"> <h1 className="text-xl sm:text-2xl font-bold text-foreground break-all"> {pageTitle} </h1> {resourceUrl && (<a href={resourceUrl} target="_blank" rel="noopener noreferrer" title="View on GitHub" className="inline-flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"> <Github size={14} /> <span>View on GitHub</span> </a>)} </div>
            {/* Content Area */}
            <div>
                {fileData && (<> {Object.keys(fileData.data).length > 0 && (<details className="mb-6 p-3 border border-border dark:border-darkborder rounded bg-neutral-50 dark:bg-neutral-900/50 text-xs cursor-pointer group"> <summary className="font-semibold text-sm list-none select-none flex justify-between items-center"> <span>View Frontmatter</span> <span className="text-neutral-400 transition-transform duration-200 ease-out group-open:rotate-90">▼</span> </summary> <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">{JSON.stringify(fileData.data, null, 2)}</pre> </details>)} {requestedDisplayPath.endsWith('.md') ? (<VaultMarkdownRenderer markdownContent={fileData.content} vaultId={vaultId} basePath={markdownBasePath} />) : (<pre className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap border border-border dark:border-darkborder"> {fileData.content} </pre>)} </>)}
                {dirData && (<DirectoryListing items={dirData} vaultId={vaultId} currentPath={requestedDisplayPath} vaultBasePath={vault.basePath} />)}
            </div>
        </div>
    );
}