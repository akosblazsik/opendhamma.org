// lib/github.ts
import { Octokit } from "@octokit/rest";
import { Buffer } from 'buffer'; // Node.js Buffer
import matter from 'gray-matter'; // For parsing YAML frontmatter

// Initialize Octokit
// Use GITHUB_TOKEN from environment variables for authentication
// This token needs appropriate permissions (e.g., 'repo' or at least 'public_repo')
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    // Optional: Add user agent
    userAgent: 'OpendhammaApp/v0.1',
    // Optional: Add logging for debugging
    // log: console,
});

// Interface for parsed file content including frontmatter
export interface GitHubFileContent {
    content: string; // Markdown/file content (without frontmatter)
    data: { [key: string]: any }; // Parsed frontmatter data
    sha: string; // Git blob SHA
    path: string; // Full path within the repository
    name: string; // File name
    html_url: string; // URL to view the file on GitHub.com
    size: number; // File size in bytes
}

// Interface for items listed in a directory
export interface GitHubDirectoryContent {
    type: 'file' | 'dir';
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string; // API URL for the content
    html_url: string; // GitHub web URL
    download_url: string | null; // URL for raw download (files only)
}

// Helper to parse 'owner/repo' string
const parseRepoString = (repoString: string): { owner: string; repo: string } => {
    const parts = repoString.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(`Invalid repository string format: "${repoString}". Expected "owner/repo".`);
    }
    return { owner: parts[0], repo: parts[1] };
};

// Function to fetch and parse file content from GitHub
export async function getFileContent(
    repoString: string,
    filePath: string,
    ref?: string // Optional branch, tag, or commit SHA
): Promise<GitHubFileContent | null> {
    try {
        const { owner, repo } = parseRepoString(repoString);
        // console.log(`Fetching file: ${owner}/${repo}/${filePath}` + (ref ? ` @ ${ref}` : ''));

        const response = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: ref, // Use default branch if ref is undefined
            // No mediaType needed, default response includes necessary info including 'content'
        });

        // Check if the response is for a file
        if (Array.isArray(response.data) || response.data.type !== 'file' || !response.data.content) {
            console.warn(`Content at ${filePath} in ${repoString} is not a file or content is missing.`);
            return null;
        }

        // Decode the Base64 encoded content
        const decodedContent = Buffer.from(response.data.content, 'base64').toString('utf8');

        // Use gray-matter to parse frontmatter (if any)
        const { content: mainContent, data: frontmatterData } = matter(decodedContent);

        return {
            content: mainContent,
            data: frontmatterData,
            sha: response.data.sha,
            path: response.data.path,
            name: response.data.name,
            html_url: response.data.html_url,
            size: response.data.size,
        };

    } catch (error: any) {
        if (error.status === 404) {
            // console.log(`File not found: ${filePath} in ${repoString}`);
            return null; // Handle file not found gracefully
        }
        console.error(`Error fetching file content from GitHub (${repoString}/${filePath}):`, error.status, error.message);
        // Rethrow or handle other errors (e.g., rate limiting, auth issues)
        throw error; // Rethrow to be caught by the page component
    }
}


// Function to fetch directory contents from GitHub
export async function getDirectoryContent(
    repoString: string,
    dirPath: string = '', // Empty string for repository root
    ref?: string
): Promise<GitHubDirectoryContent[] | null> {
    try {
        const { owner, repo } = parseRepoString(repoString);
        // console.log(`Fetching directory: ${owner}/${repo}/${dirPath}` + (ref ? ` @ ${ref}` : ''));

        const response = await octokit.repos.getContent({
            owner,
            repo,
            path: dirPath,
            ref: ref,
        });

        // Ensure the response is an array (indicating a directory listing)
        if (!Array.isArray(response.data)) {
            console.warn(`Content at ${dirPath} in ${repoString} is not a directory.`);
            return null;
        }

        // Map to the GitHubDirectoryContent interface
        return response.data.map(item => ({
            type: item.type as 'file' | 'dir',
            name: item.name,
            path: item.path,
            sha: item.sha,
            size: item.size,
            url: item.url,
            html_url: item.html_url,
            download_url: item.download_url || null,
        }));

    } catch (error: any) {
        if (error.status === 404) {
            // console.log(`Directory not found: ${dirPath} in ${repoString}`);
            return null; // Handle directory not found gracefully
        }
        console.error(`Error fetching directory content from GitHub (${repoString}/${dirPath}):`, error.status, error.message);
        throw error; // Rethrow for page component to handle
    }
}

// Potential future functions:
// - getFileMetadata: Fetch only metadata without content (faster if content not needed)
// - createFileOrUpdate: Create/update file content (requires write permissions/different auth flow)
// - createPullRequest: For suggesting changes