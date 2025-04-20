// lib/github.ts
import { Octokit } from "@octokit/rest";
import { Buffer } from 'buffer'; // Node.js Buffer
import matter from 'gray-matter'; // For parsing YAML frontmatter

// Initialize Octokit
// Use GITHUB_TOKEN from environment variables for authentication
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: 'OpendhammaApp/v0.1',
});

// Interface for parsed file content including frontmatter
export interface GitHubFileContent {
    content: string;
    data: { [key: string]: any };
    sha: string;
    path: string;
    name: string;
    html_url: string; // Expecting string
    size: number;
}

// Interface for items listed in a directory
export interface GitHubDirectoryContent {
    type: 'file' | 'dir';
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string; // Expecting string
    download_url: string | null;
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
    ref?: string
): Promise<GitHubFileContent | null> {
    try {
        const { owner, repo } = parseRepoString(repoString);
        const response = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: ref,
        });

        if (Array.isArray(response.data) || response.data.type !== 'file' || !response.data.content) {
            console.warn(`Content at ${filePath} in ${repoString} is not a file or content is missing.`);
            return null;
        }

        const decodedContent = Buffer.from(response.data.content, 'base64').toString('utf8');
        const { content: mainContent, data: frontmatterData } = matter(decodedContent);

        return {
            content: mainContent,
            data: frontmatterData,
            sha: response.data.sha,
            path: response.data.path,
            name: response.data.name,
            // Ensure html_url is string, provide fallback if null/undefined
            html_url: response.data.html_url ?? '',
            size: response.data.size,
        };

    } catch (error: any) {
        if (error.status === 404) {
            return null;
        }
        console.error(`Error fetching file content from GitHub (${repoString}/${filePath}):`, error.status, error.message);
        throw error;
    }
}


// Function to fetch directory contents from GitHub
export async function getDirectoryContent(
    repoString: string,
    dirPath: string = '',
    ref?: string
): Promise<GitHubDirectoryContent[] | null> {
    try {
        const { owner, repo } = parseRepoString(repoString);
        const response = await octokit.repos.getContent({
            owner,
            repo,
            path: dirPath,
            ref: ref,
        });

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
            // **CORRECTION APPLIED HERE**: Ensure html_url is string for the interface
            html_url: item.html_url ?? '', // Provide fallback if null/undefined
            download_url: item.download_url || null,
        }));

    } catch (error: any) {
        if (error.status === 404) {
            return null;
        }
        console.error(`Error fetching directory content from GitHub (${repoString}/${dirPath}):`, error.status, error.message);
        throw error;
    }
}