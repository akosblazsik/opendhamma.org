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
// Using process.env allows overriding the path, defaults to 'data/vaults.yaml'
const VAULT_REGISTRY_PATH = path.resolve(process.env.VAULT_REGISTRY_PATH || path.join(process.cwd(), 'data', 'vaults.yaml'));

// Cache the loaded vaults to avoid repeated file reads and parsing
let cachedVaults: VaultConfig[] | null = null;
let registryLoadError: Error | null = null;

/**
 * Loads, validates, and caches the vault registry from the YAML file.
 * Throws an error if the file is missing, invalid YAML, or fails schema validation.
 * @returns An array of validated VaultConfig objects.
 */
export function getVaultRegistry(): VaultConfig[] {
    // Return cached data if available
    if (cachedVaults) {
        return cachedVaults;
    }
    // If there was a previous load error, throw it again
    if (registryLoadError) {
        throw registryLoadError;
    }

    try {
        // console.log(`Attempting to load vault registry from: ${VAULT_REGISTRY_PATH}`);
        if (!fs.existsSync(VAULT_REGISTRY_PATH)) {
            throw new Error(`Vault registry file not found at ${VAULT_REGISTRY_PATH}`);
        }

        const fileContents = fs.readFileSync(VAULT_REGISTRY_PATH, 'utf8');
        const rawData = yaml.load(fileContents);

        // Validate the loaded data against the Zod schema
        const validationResult = VaultRegistrySchema.safeParse(rawData);

        if (!validationResult.success) {
            // Log detailed validation errors
            console.error("Vault registry validation failed:", validationResult.error.errors);
            throw new Error(`Invalid vault registry format in ${VAULT_REGISTRY_PATH}. Check console logs for details.`);
        }

        const vaults = validationResult.data;

        // Check that there is exactly one default vault
        const defaultVaults = vaults.filter(vault => vault.default);
        if (defaultVaults.length !== 1) {
            console.warn(`Expected exactly one default vault, but found ${defaultVaults.length}. Count: ${defaultVaults.length}, IDs: ${defaultVaults.map(v => v.id).join(', ')}`);
            // Depending on requirements, you might throw an error here or just log a warning
            // throw new Error(`Configuration error: Must have exactly one default vault in ${VAULT_REGISTRY_PATH}. Found ${defaultVaults.length}.`);
        }

        // Cache the validated vaults
        cachedVaults = vaults;
        // console.log(`Successfully loaded and validated ${vaults.length} vaults.`);
        return vaults;

    } catch (error: any) {
        console.error("Error loading or validating vault registry:", error.message);
        registryLoadError = error; // Cache the error
        // Depending on strictness, re-throw or return empty array
        throw new Error(`Failed to load vault registry: ${error.message}`);
        // return []; // Or return empty array if the app should try to function without vaults
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
    // console.log("Vault registry cache cleared.");
}