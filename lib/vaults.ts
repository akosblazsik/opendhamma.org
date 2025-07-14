// lib/vaults.ts
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod'; // Using Zod for validation

// Define the schema for a single vault configuration using Zod
const VaultConfigSchema = z.object({
    id: z.string().min(1, "Vault ID cannot be empty"),
    name: z.string().min(1, "Vault name cannot be empty"),
    repo: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/, "Invalid repo format. Expected 'owner/repo'"),
    basePath: z.string().optional(), // Optional base path within the repo (ADDED)
    default: z.boolean(),
    topics: z.array(z.string()).optional().default([]),
    languages: z.array(z.string()).optional().default([]),
    readonly: z.boolean(),
});

// Define the schema for the entire vault registry (an array of vaults)
const VaultRegistrySchema = z.array(VaultConfigSchema);

// Infer the TypeScript type from the Zod schema
export type VaultConfig = z.infer<typeof VaultConfigSchema>;

// Construct the path to the vaults registry file
const VAULT_REGISTRY_PATH = path.resolve(process.env.VAULT_REGISTRY_PATH || path.join(process.cwd(), 'data', 'vaults.yaml'));

// Cache the loaded vaults
let cachedVaults: VaultConfig[] | null = null;
let registryLoadError: Error | null = null;

/**
 * Loads, validates, and caches the vault registry from the YAML file.
 * Throws an error if the file is missing, invalid YAML, or fails schema validation.
 * @returns An array of validated VaultConfig objects.
 */
export function getVaultRegistry(): VaultConfig[] {
    if (cachedVaults) {
        return cachedVaults;
    }
    if (registryLoadError) {
        throw registryLoadError;
    }

    try {
        if (!fs.existsSync(VAULT_REGISTRY_PATH)) {
            throw new Error(`Vault registry file not found at ${VAULT_REGISTRY_PATH}`);
        }

        const fileContents = fs.readFileSync(VAULT_REGISTRY_PATH, 'utf8');
        const rawData = yaml.load(fileContents);
        const validationResult = VaultRegistrySchema.safeParse(rawData);

        if (!validationResult.success) {
            console.error("Vault registry validation failed:", validationResult.error.errors);
            throw new Error(`Invalid vault registry format in ${VAULT_REGISTRY_PATH}. Check console logs for details.`);
        }

        const vaults = validationResult.data;
        const defaultVaults = vaults.filter(vault => vault.default);
        if (defaultVaults.length !== 1) {
            console.warn(`Expected exactly one default vault, but found ${defaultVaults.length}. Count: ${defaultVaults.length}, IDs: ${defaultVaults.map(v => v.id).join(', ')}`);
            // Optionally throw: throw new Error(`Config error: Must have exactly one default vault.`);
        }

        // Clean up basePath: remove leading/trailing slashes
        vaults.forEach(vault => {
            if (vault.basePath) {
                vault.basePath = vault.basePath.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
                if (vault.basePath === '') delete vault.basePath; // Remove if empty after trimming
            }
        });

        cachedVaults = vaults;
        return vaults;

    } catch (error: any) {
        console.error("Error loading or validating vault registry:", error.message);
        registryLoadError = error;
        throw new Error(`Failed to load vault registry: ${error.message}`);
    }
}

/**
 * Finds and returns the vault marked as default in the registry.
 * @returns The default VaultConfig object, or undefined if no default is found or registry fails to load.
 */
export function getDefaultVault(): VaultConfig | undefined {
    try {
        const vaults = getVaultRegistry();
        return vaults.find(vault => vault.default);
    } catch (error) {
        console.error("Cannot get default vault due to registry load error:", (error as Error).message);
        return undefined;
    }
}

/**
 * Finds and returns a vault by its unique ID.
 * @param id The ID of the vault to find.
 * @returns The VaultConfig object if found, or undefined otherwise or if registry fails to load.
 */
export function getVaultById(id: string): VaultConfig | undefined {
    try {
        const vaults = getVaultRegistry();
        return vaults.find(vault => vault.id === id);
    } catch (error) {
        console.error(`Cannot get vault by ID "${id}" due to registry load error:`, (error as Error).message);
        return undefined;
    }
}

// Function to clear the cache (useful for development or testing)
export function clearVaultCache(): void {
    cachedVaults = null;
    registryLoadError = null;
}