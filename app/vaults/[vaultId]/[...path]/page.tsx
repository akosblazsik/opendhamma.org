// app/vaults/[vaultId]/[...path]/page.tsx
import { getVaultById } from '@/lib/vaults';
import { getFileContent, getDirectoryContent, GitHubDirectoryContent, GitHubFileContent } from '@/lib/github';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, Folder, Github, ArrowLeft } from 'lucide-react';

interface VaultPageProps {
    params: {
        vaultId: string;
        path: string[]; // Catch-all route segments
    };
}

// Reusable Markdown Renderer (similar to SuttaPage, could be extracted)
function VaultMarkdownRenderer({ markdownContent, vaultId, basePath }: { markdownContent: string, vaultId: string, basePath: string }) {
    // Basic [[wiki-link]] handling within the current vault
    const processedMarkdown = markdownContent.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (match, linkTarget, linkDisplay) => {
        // Basic slugification: replace spaces, convert to lower case. Needs improvement for complex cases.
        const targetSlug = linkTarget.trim().replace(/ /g, '-').toLowerCase();
        // Attempt to link to the target within the same vault - assumes .md extension if not specified
        // This doesn't know if the target file actually exists or its exact path structure!
        const targetPath = targetSlug.endsWith('.md') ? targetSlug : `${targetSlug}.md`;
        const display = linkDisplay ? linkDisplay.substring(1) : linkTarget.trim(); // Use display text if provided (|), otherwise target

        // Try to construct a relative path if possible (better for complex vaults)
        // let fullTargetPath = basePath ? `${basePath}/${targetPath}` : targetPath; // Simplistic relative path
        // return `[${display}](/vaults/${vaultId}/${fullTargetPath})`;

        // Simple link structure for now (assumes file is at root or requires full path in link)
        return `[${display}](/vaults/${vaultId}/${targetPath})`;
    });

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
                a: ({ href, children }) => {
                    if (href?.startsWith('/') && !href.startsWith('//')) { // Check if it's an internal link
                        return <Link href={href} className="text-blue-600 dark:text-blue-400 hover:underline">{children}</Link>;
                    }
                    // Assume external link if not starting with /
                    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{children}</a>;
                },
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 border-b pb-2 dark:border-gray-700" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold mt-5 mb-3" {...props} />,
                code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto my-2"><code className={className} {...props}>{children}</code></pre>
                    ) : (
                        <code className={`bg-gray-100 dark:bg-gray-700 px-1 rounded text-sm ${className}`} {...props}>
                            {children}
                        </code>
                    )
                },
            }}
            className="prose prose-lg dark:prose-invert max-w-none"
        >
            {processedMarkdown}
        </ReactMarkdown>
    );
}

// Component to render a directory listing
function DirectoryListing({ items, vaultId, currentPath }: { items: GitHubDirectoryContent[], vaultId: string, currentPath: string }) {
    const sortedItems = [...items].sort((a, b) => {
        if (a.type === 'dir' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });

    // Parent directory link (unless at root)
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const showParentLink = currentPath !== '';

    return (
        <div>
            {/* Optional: Parent Directory Link */}
            {showParentLink && (
                <Link href={`/vaults/${vaultId}/${parentPath}`} className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4">
                    <ArrowLeft size={16} />
                    <span>Parent Directory</span>
                </Link>
            )}

            <ul className="space-y-1">
                {sortedItems.map(item => (
                    <li key={item.sha}>
                        <Link href={`/vaults/${vaultId}/${item.path}`} className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
                            {item.type === 'dir'
                                ? <Folder size={18} className="text-yellow-500 flex-shrink-0" />
                                : <FileText size={18} className="text-blue-500 flex-shrink-0" />
                            }
                            <span className="flex-grow truncate">{item.name}</span>
                            {/* Optional: Add size or modified date if available/needed */}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}


export default async function VaultPathPage({ params }: VaultPageProps) {
    const { vaultId, path: pathSegments } = params;
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
        // Render an error message instead of crashing
        return (
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Vault Content</h1>
                <p className="text-red-500">{errorMsg}</p>
                <p className="mt-4 text-sm text-gray-500">Vault: {vault.name} ({vault.repo})</p>
                <p className="text-sm text-gray-500">Path: /{requestedPath}</p>
            </div>
        )
    }

    // Determine base path for relative link resolution in Markdown
    const basePath = requestedPath.includes('/') ? requestedPath.substring(0, requestedPath.lastIndexOf('/')) : '';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow">
            {/* Header with Path and GitHub Link */}
            <div className="mb-6 pb-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
                <h1 className="text-2xl font-bold break-all">
                    {/* Display file name or directory path */}
                    {fileData ? fileData.name : `Browsing: /${requestedPath || vault.name}`}
                </h1>
                {resourceUrl && (
                    <a href={resourceUrl} target="_blank" rel="noopener noreferrer" title="View on GitHub"
                        className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center space-x-1 text-sm flex-shrink-0">
                        <Github size={16} />
                        <span>View on GitHub</span>
                    </a>
                )}
            </div>

            {/* Render File Content */}
            {fileData && (
                <>
                    {/* Display Frontmatter if present */}
                    {Object.keys(fileData.data).length > 0 && (
                        <div className="mb-6 p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700/50 text-xs">
                            <h3 className="font-semibold mb-1 text-sm">Frontmatter</h3>
                            <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(fileData.data, null, 2)}</pre>
                        </div>
                    )}

                    {/* Render Markdown or Plain Text */}
                    {requestedPath.endsWith('.md') ? (
                        <VaultMarkdownRenderer markdownContent={fileData.content} vaultId={vaultId} basePath={basePath} />
                    ) : (
                        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
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
    );
}