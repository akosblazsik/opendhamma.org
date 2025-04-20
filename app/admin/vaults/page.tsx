// app/admin/vaults/page.tsx
import { getVaultRegistry } from "@/lib/vaults";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Github } from "lucide-react";

// Reuse or import admin check logic
async function isAdmin(session: any): Promise<boolean> {
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(',');
    return session?.user?.email && adminEmails.includes(session.user.email);
}

export default async function VaultAdminPage() {
    const session = await auth();
    if (!session || !(await isAdmin(session))) {
        redirect('/');
    }

    const vaults = getVaultRegistry();
    // TODO: Add server actions or API routes for functionality:
    // - Set default vault (modify vaults.yaml or use a database flag)
    // - Add new vault (validate repo, update vaults.yaml)
    // - Remove vault
    // - Edit vault metadata

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Vault Management</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Manage the vaults registered in the application (`data/vaults.yaml`). Changes here might require an application restart if `vaults.yaml` is modified directly.</p>

            {/* TODO: Add Button/Form to Add New Vault */}
            {/* <button className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add New Vault</button> */}

            <div className="space-y-4">
                {vaults.length > 0 ? vaults.map(v => (
                    <div key={v.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">{v.name} {v.default && <span className="text-xs text-green-600 dark:text-green-400">(Default)</span>}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">ID: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{v.id}</code></p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                                <Github size={14} />
                                <a href={`https://github.com/${v.repo}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{v.repo}</a>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{v.readonly ? 'Read-only' : 'Writable (via PRs)'}</p>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                            {/* TODO: Add action buttons */}
                            {!v.default && <button className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" disabled>Set as Default</button>}
                            <button className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" disabled>Edit</button>
                            <button className="text-xs px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/50 disabled:opacity-50" disabled>Remove</button>
                        </div>
                    </div>
                )) : (
                    <p className="text-gray-500">No vaults found in the registry.</p>
                )}
            </div>
        </div>
    );
}