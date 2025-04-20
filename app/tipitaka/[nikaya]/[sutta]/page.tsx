// app/tipitaka/[nikaya]/[sutta]/page.tsx

import { getDefaultVault } from '@/lib/vaults';
import { getFileContent, getDirectoryContent, GitHubFileContent, GitHubDirectoryContent } from '@/lib/github';
// Remove unused imports if session is not needed on this page yet
// import { authOptions } from "@/lib/auth";
// import { getServerSession } from "next-auth/next";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Github, AlertCircle } from 'lucide-react';

/**
 * Props for the Sutta Page Server Component.
 * Next.js automatically provides `params` for dynamic routes
 * and `searchParams` for URL query strings.
 */
type SuttaPageProps = {
    params: { nikaya: string; sutta: string };
    searchParams?: { [key: string]: string | string[] | undefined }; // Optional searchParams
};


// Component to render Markdown with vault-aware links & typography
// Prefix unused parameters with _ to satisfy ESLint if needed
function MarkdownRenderer({ markdownContent, vaultId, basePath: _basePath, nikaya: _nikaya, sutta: _sutta }: { markdownContent: string, vaultId: string | null, basePath: string, nikaya: string, sutta: string }) {
    // Corrected regex to match standard wiki links [[target]] or [[target|display]]
    const processedMarkdown = markdownContent.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (match, linkTarget, linkDisplay) => {
        const targetSlug = linkTarget.trim().replace(/ /g, '-').toLowerCase();
        const targetPath = targetSlug.endsWith('.md') ? targetSlug : `${targetSlug}.md`; // Basic assumption
        const display = linkDisplay ? linkDisplay.substring(1).trim() : linkTarget.trim(); // Trim display text too

        // Improved link handling: Check if it looks like another sutta reference first
        const suttaRegex = /([a-z]+)(\d+(\.\d+)?)/i;
        const suttaMatch = linkTarget.match(suttaRegex);
        if (suttaMatch && vaultId === getDefaultVault()?.id) {
            const targetNikaya = suttaMatch[1].toLowerCase();
            const targetSutta = linkTarget.toLowerCase(); // Use the whole match as identifier
            return `[${display}](/tipitaka/${targetNikaya}/${targetSutta})`;
        }

        // Otherwise, link within the current vault (needs better pathing)
        // return `[${display}](/vaults/${vaultId}/${_basePath ? _basePath + '/' : ''}${targetPath})`; // Example relative link using potentially unused var
        return `[${display}](/vaults/${vaultId}/${targetPath})`; // Simpler link for now
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
                    code: ({ node: _node, inline, className, children, ...props }) => { // Prefix unused node with _
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                            <pre className="bg-neutral-100 dark:bg-neutral-900 p-3 rounded overflow-x-auto my-4 border border-border dark:border-darkborder"><code className={`language-${match?.[1]} whitespace-pre-wrap`} {...props}>{children}</code></pre>
                        ) : (
                            <code className="bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                        );
                    },
                    // Headings will be styled by prose, add overrides if needed
                    // h1: ({node: _node, ...props}) => <h1 {...props} />,
                    // h2: ({node: _node, ...props}) => <h2 {...props} />,
                }}
            >
                {processedMarkdown}
            </ReactMarkdown>
        </div>
    );
}

// --- Main Sutta Page Component ---
// Use the type alias for props
export default async function SuttaPage({ params /*, searchParams */ }: SuttaPageProps) {
    const { nikaya, sutta } = params;
    // const session = await getServerSession(authOptions); // Fetch session if needed

    let defaultVault;
    let fileData: GitHubFileContent | null = null;
    let availableFiles: GitHubDirectoryContent[] | null = null;
    let loadedPath: string = '';
    let errorMsg: string | null = null;

    try {
        defaultVault = getDefaultVault();
        if (!defaultVault) {
            throw new Error("Default vault not configured.");
        }

        // Adjust base path based on vault structure if needed
        const basePath = `tipitaka/sutta/${nikaya.toLowerCase()}/${sutta.toLowerCase()}`;

        // Fetch directory contents first to know available versions
        availableFiles = await getDirectoryContent(defaultVault.repo, basePath);

        if (availableFiles && availableFiles.length > 0) {
            // Try preferred files
            const preferredFileNames = [`en/curated.md`, `en/ai.md`, `pali.md`];
            const fallbackFiles = availableFiles
                .filter(f => f.type === 'file' && f.name.endsWith('.md') && !preferredFileNames.some(pref => f.path.endsWith(pref)))
                .map(f => f.path);
            const pathsToTry = [
                ...preferredFileNames.map(name => `${basePath}/${name}`),
                ...fallbackFiles
            ];

            for (const path of pathsToTry) {
                const currentFileData = await getFileContent(defaultVault.repo, path);
                if (currentFileData) {
                    fileData = currentFileData;
                    loadedPath = path;
                    break;
                }
            }
            if (!fileData) errorMsg = `Could not find a displayable Markdown version for ${sutta} in ${basePath}.`;

        } else {
            // Try direct file path as fallback
            const directFilePath = `tipitaka/sutta/${nikaya.toLowerCase()}/${sutta.toLowerCase()}.md`;
            fileData = await getFileContent(defaultVault.repo, directFilePath);
            if (fileData) {
                loadedPath = directFilePath;
            } else {
                // If directory and direct file fail, trigger 404
                notFound();
            }
        }

    } catch (error: any) {
        console.error(`Error fetching sutta ${nikaya}/${sutta}:`, error);
        errorMsg = `Error loading sutta data: ${error.message}`;
        if (error.status === 404) notFound(); // Ensure 404 is triggered on explicit 404
        if (!defaultVault) defaultVault = getDefaultVault(); // Try getting vault info for error display
    }

    // Render Error State
    if (errorMsg && !fileData) { // Show error only if no file data was loaded
        return (
            <div className="p-6 md:p-8 rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 shadow">
                <div className="flex items-center space-x-3 mb-4">
                    <AlertCircle className="text-red-500 dark:text-red-400" size={24} />
                    <h1 className="text-xl font-semibold text-red-700 dark:text-red-300">Error Loading Sutta</h1>
                </div>
                <p className="text-red-600 dark:text-red-200 mb-2">{errorMsg}</p>
                {defaultVault && <p className="text-sm text-neutral-500 dark:text-neutral-400">Vault: {defaultVault.name} ({defaultVault.repo})</p>}
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Path Attempted: `tipitaka/sutta/{nikaya}/{sutta}/...`</p>
            </div>
        );
    }

    // Safeguard: Should be caught by notFound() earlier, but ensures fileData exists
    if (!fileData) {
        notFound();
    }

    // Render Sutta Content
    const lang = fileData.data?.lang || loadedPath.split('/').find(seg => ['en', 'pi'].includes(seg)) || 'unknown';
    const otherVersions = availableFiles
        ? availableFiles.filter(f => f.type === 'file' && f.path !== loadedPath && f.name.endsWith('.md'))
        : [];
    // Correctly define suttaBasePath based on loadedPath
    const suttaBasePath = loadedPath.includes('/') ? loadedPath.substring(0, loadedPath.lastIndexOf('/')) : '';


    return (
        <div className="bg-white dark:bg-neutral-800/50 p-4 sm:p-6 md:p-8 rounded-lg shadow border border-border dark:border-darkborder">
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-border dark:border-darkborder flex justify-between items-center flex-wrap gap-2">
                <div>
                    {fileData.data?.title && <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{fileData.data.title}</h1>}
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 capitalize">{sutta} ({nikaya.toUpperCase()}) - [{lang.toUpperCase()}]</p>
                </div>
                <a href={fileData.html_url} target="_blank" rel="noopener noreferrer" title="View source on GitHub"
                    className="inline-flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors">
                    <Github size={14} />
                    <span>View Source</span>
                </a>
            </div>

            {/* Frontmatter */}
            {Object.keys(fileData.data).length > 0 && (
                <details className="mb-6 p-3 border border-border dark:border-darkborder rounded bg-neutral-50 dark:bg-neutral-900/50 text-xs cursor-pointer group">
                    <summary className="font-semibold text-sm list-none select-none flex justify-between items-center">
                        <span>Document Info</span>
                        <span className="text-neutral-400 transition-transform duration-200 ease-out group-open:rotate-90">▼</span>
                    </summary>
                    <div className="mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
                        {fileData.data.translator && <p><strong>Translator:</strong> {fileData.data.translator}</p>}
                        {fileData.data.source && <p><strong>Source:</strong> {fileData.data.source}</p>}
                        {fileData.data.status && <p><strong>Status:</strong> <span className="capitalize">{fileData.data.status}</span></p>}
                        {fileData.data.version && <p><strong>Version:</strong> {fileData.data.version}</p>}
                        {fileData.data.reviewed_by && Array.isArray(fileData.data.reviewed_by) && fileData.data.reviewed_by.length > 0 && (
                            <p><strong>Reviewed By:</strong> {fileData.data.reviewed_by.join(', ')}</p>
                        )}
                    </div>
                </details>
            )}

            {/* Main Content */}
            {/* Pass the correct props to MarkdownRenderer */}
            <MarkdownRenderer markdownContent={fileData.content} vaultId={defaultVault?.id || null} basePath={suttaBasePath} nikaya={nikaya} sutta={sutta} />


            {/* Other Versions (Placeholder UI) */}
            {otherVersions.length > 0 && (
                <div className="mt-8 pt-4 border-t border-border dark:border-darkborder">
                    <h4 className="font-semibold mb-2 text-foreground">Other Available Versions:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {otherVersions.map(version => {
                            const versionLang = version.path.split('/').find(seg => ['en', 'pi'].includes(seg));
                            const versionName = version.name.replace('.md', '');
                            // TODO: Implement actual version switching (e.g., via query params + state management)
                            return (
                                <li key={version.path} className="text-neutral-700 dark:text-neutral-300">
                                    {versionName} ({versionLang || 'unknown'}) -
                                    <a href={version.html_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-primary-600 dark:text-primary-400 hover:underline">(Source)</a>
                                    {/* Placeholder link - needs functionality */}
                                    {/* <Link href={`/tipitaka/${nikaya}/${sutta}?version=${encodeURIComponent(version.path)}`} className="ml-2 text-xs">(Load)</Link> */}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}