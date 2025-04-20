// app/tipitaka/page.tsx
import Link from 'next/link';
import { getDefaultVault } from '@/lib/vaults'; // Removed getVaultRegistry as it's unused here
import { getDirectoryContent } from '@/lib/github';
import { AlertCircle } from 'lucide-react'; // Import an icon for errors

// Define the component correctly
export default async function TipitakaHomePage() {
    let defaultVault;
    let nikayas = null;
    let errorMessage = null;

    try {
        defaultVault = getDefaultVault();

        if (!defaultVault) {
            errorMessage = "Default vault not configured in `data/vaults.yaml`.";
        } else {
            // Optional: Fetch top-level directories (Nikayas) from the default vault's 'tipitaka' path
            // Adjust 'tipitaka' if your vault structure is different (e.g., 'canon', 'texts')
            nikayas = await getDirectoryContent(defaultVault.repo, 'tipitaka');
            // console.log("Fetched Nikayas:", nikayas); // For debugging
        }
    } catch (error: any) {
        console.error("Error fetching Tipitaka data:", error);
        errorMessage = `Failed to load Tipitaka index: ${error.message}`;
        // Ensure defaultVault is potentially undefined if the initial call failed
        if (!defaultVault) defaultVault = undefined;
    }

    // Now, the return statement is inside the component function
    return (
        <div> {/* Root JSX element */}
            <h1 className="text-3xl font-bold mb-6">Pali Canon (Tipitaka)</h1>

            {errorMessage && (
                <div className="mb-4 p-4 border border-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center space-x-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-red-700 dark:text-red-300">{errorMessage}</p>
                </div>
            )}

            {defaultVault && !errorMessage && (
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                    Browse the canonical texts from the default vault: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-sm">{defaultVault.name} ({defaultVault.repo})</code>.
                </p>
            )}

            {/* Only show listing if vault loaded and no error occurred */}
            {defaultVault && !errorMessage && nikayas && nikayas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nikayas
                        .filter(item => item.type === 'dir') // Ensure we only list directories
                        .map(nikaya => (
                            <div key={nikaya.sha} className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                                <h2 className="text-xl font-semibold mb-2 capitalize">{nikaya.name} Nikāya</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Contains suttas related to {nikaya.name}.</p>
                                {/*
                                  IMPORTANT: This link assumes you will create a page at
                                  /tipitaka/[nikaya]/page.tsx to list the suttas within that nikaya.
                                  For now, it will lead to a 404 if that page doesn't exist.
                                */}
                                <Link href={`/tipitaka/${nikaya.name.toLowerCase()}`}
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                                    Browse {nikaya.name.toUpperCase()} →
                                </Link>
                            </div>
                        ))}
                </div>
            ) : (
                // Show this message if nikayas is null (error during fetch) or empty, but only if there wasn't a preceding error message
                !errorMessage && defaultVault && (
                    <p className="text-gray-500 dark:text-gray-400">
                        Could not load Nikaya listing. The tipitaka directory might be empty or missing in the default vault (`{defaultVault?.repo}`).
                    </p>
                )
            )}

            {/* Add search functionality placeholder later */}
            {<div className="mt-8">Search Component Placeholder</div>}

        </div> // Closing root JSX element
    );
}