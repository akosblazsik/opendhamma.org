// lib/github.ts
import { Octokit } from "@octokit/rest";
import { Buffer } from 'buffer';
import matter from 'gray-matter';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: 'OpendhammaApp/v0.1',
});

export interface GitHubFileContent {
    content: string;
    data: { [key: string]: any };
    sha: string;
    path: string;
    name: string;
    html_url: string;
    size: number;
}

export interface GitHubDirectoryContent {
    type: 'file' | 'dir';
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    download_url: string | null;
}

const parseRepoString = (repoString: string): { owner: string; repo: string } => {
    const parts = repoString.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(`Invalid repository string format: "${repoString}". Expected "owner/repo".`);
    }
    return { owner: parts[0], repo: parts[1] };
};

/**
 * Joins path segments cleanly, avoiding duplicate slashes.
 * @param segments Path segments to join
 * @returns Combined path string
 */
function joinPaths(...segments: (string | undefined | null)[]): string {
    return segments
        .filter(Boolean) // Remove undefined/null/empty segments
        .map((segment, index) => {
            // Remove leading slash from non-first segments and trailing slash from non-last segments
            let cleanedSegment = segment as string;
            if (index > 0) cleanedSegment = cleanedSegment.replace(/^\/+/, '');
            if (index < segments.length - 1) cleanedSegment = cleanedSegment.replace(/\/+$/, '');
            return cleanedSegment;
        })
        .join('/')
        .replace(/\/+/g, '/'); // Replace multiple slashes with single
}

// Updated function to accept and use repoBasePath
export async function getFileContent(
    repoString: string,
    filePath: string,
    repoBasePath: string | undefined, // Added parameter
    ref?: string
): Promise<GitHubFileContent | null> {
    try {
        const { owner, repo } = parseRepoString(repoString);
        // Construct the full path using the helper function
        const fullPath = joinPaths(repoBasePath, filePath);
        // console.log(`Fetching file: ${owner}/${repo}/${fullPath}` + (ref ? ` @ ${ref}` : ''));

        const response = await octokit.repos.getContent({
            owner,
            repo,
            path: fullPath, // Use the constructed full path
            ref: ref,
        });

        if (Array.isArray(response.data) || response.data.type !== 'file' || !response.data.content) {
            // console.warn(`Content at ${fullPath} in ${repoString} is not a file or content is missing.`);
            return null;
        }

        const decodedContent = Buffer.from(response.data.content, 'base64').toString('utf8');
        const { content: mainContent, data: frontmatterData } = matter(decodedContent);

        return {
            content: mainContent,
            data: frontmatterData,
            sha: response.data.sha,
            path: response.data.path, // Path relative to repo root as returned by API
            name: response.data.name,
            html_url: response.data.html_url ?? '',
            size: response.data.size,
        };

    } catch (error: any) {
        if (error.status === 404) {
            return null;
        }
        console.error(`Error fetching file content from GitHub (${repoString}/${joinPaths(repoBasePath, filePath)}):`, error.status, error.message);
        throw error;
    }
}


// Updated function to accept and use repoBasePath
export async function getDirectoryContent(
    repoString: string,
    dirPath: string = '',
    repoBasePath: string | undefined, // Added parameter
    ref?: string
): Promise<GitHubDirectoryContent[] | null> {
    try {
        const { owner, repo } = parseRepoString(repoString);
        // Construct the full path using the helper function
        const fullPath = joinPaths(repoBasePath, dirPath);
        // console.log(`Fetching directory: ${owner}/${repo}/${fullPath}` + (ref ? ` @ ${ref}` : ''));

        const response = await octokit.repos.getContent({
            owner,
            repo,
            path: fullPath, // Use the constructed full path
            ref: ref,
        });

        if (!Array.isArray(response.data)) {
            // console.warn(`Content at ${fullPath} in ${repoString} is not a directory.`);
            return null;
        }

        return response.data.map(item => ({
            type: item.type as 'file' | 'dir',
            name: item.name,
            path: item.path, // Path relative to repo root as returned by API
            sha: item.sha,
            size: item.size,
            url: item.url,
            html_url: item.html_url ?? '',
            download_url: item.download_url || null,
        }));

    } catch (error: any) {
        if (error.status === 404) {
            return null;
        }
        console.error(`Error fetching directory content from GitHub (${repoString}/${joinPaths(repoBasePath, dirPath)}):`, error.status, error.message);
        throw error;
    }
}