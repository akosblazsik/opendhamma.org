# Opendhamma Documentation

Welcome to the Opendhamma project! This documentation provides guidance on setting up, using, contributing to, and understanding the Opendhamma application.

**Table of Contents:**

1.  [Introduction](#1-introduction)
    *   [Purpose & Vision](#purpose--vision)
    *   [Core Concepts](#core-concepts)
2.  [Getting Started (Developer Setup)](#2-getting-started-developer-setup)
    *   [Prerequisites](#prerequisites)
    *   [Cloning](#cloning)
    *   [Installation](#installation)
    *   [Environment Variables](#environment-variables)
        *   [Generate `GITHUB_ID` & `GITHUB_SECRET`](#generate-github_id--github_secret)
        *   [Generate `AUTH_SECRET`](#generate-auth_secret)
        *   [Generate `GITHUB_TOKEN` (PAT)](#generate-github_token-pat)
        *   [Populate `.env.local`](#populate-envlocal)
    *   [Vault Configuration (`data/vaults.yaml`)](#vault-configuration-datavaultsyaml)
    *   [Running Locally](#running-locally)
3.  [User Guide](#3-user-guide)
    *   [Browsing Content](#browsing-content)
    *   [Authentication](#authentication)
    *   [Settings](#settings)
4.  [Contribution Guide](#4-contribution-guide)
    *   [Contribution Philosophy](#contribution-philosophy)
    *   [Ways to Contribute](#ways-to-contribute)
    *   [Collaboration Workflows for Content](#collaboration-workflows-for-content)
        *   [Workflow 1: Direct GitHub Interaction (Fork & PR / Direct Branching)](#workflow-1-direct-github-interaction-fork--pr--direct-branching)
        *   [Workflow 2: App-Facilitated GitHub Editing ("Edit on GitHub" Link - Planned Phase 1)](#workflow-2-app-facilitated-github-editing-edit-on-github-link---planned-phase-1)
        *   [Workflow 3: In-App Contribution (Planned - Phase 2)](#workflow-3-in-app-contribution-planned---phase-2)
    *   [General Guidelines](#general-guidelines)
5.  [Architecture Overview](#5-architecture-overview)
    *   [Technology Stack](#technology-stack)
    *   [Key Components](#key-components)
    *   [Authentication Flow (NextAuth v4)](#authentication-flow-nextauth-v4)
    *   [Content Fetching (with basePath)](#content-fetching-with-basepath)
6.  [Deployment (Vercel)](#6-deployment-vercel)
    *   [Deployment Prerequisites](#deployment-prerequisites)
    *   [Setup Steps](#deployment-setup-steps)
    *   [Vercel Environment Variables](#vercel-environment-variables)
    *   [Update GitHub OAuth App Callback](#update-github-oauth-app-callback)
    *   [Deploy & Verify](#deploy--verify)
7.  [Future Work & Roadmap](#7-future-work--roadmap)
8.  [License](#8-license)

---

## 1. Introduction

### Purpose & Vision

Opendhamma is a next-generation, GitHub-native knowledge and translation system for dharmic teachings. It blends canonical Buddhist texts, AI-assisted multilingual tools, and community-curated content into a living ecosystem of insight.

Our vision is to modernize and actualize the transmission of Buddhist wisdom, making it globally accessible, interactive, and personally meaningful — while maintaining philosophical and linguistic rigor.

### Core Concepts

*   **GitHub-Native:** Content (like translations, notes, canonical texts) resides directly in standard GitHub repositories ("Vaults"). Collaboration leverages familiar GitHub workflows (forks, pull requests).
*   **Vaults:** GitHub repositories registered within the Opendhamma application. Each vault can contain structured Markdown content with YAML frontmatter. The app can browse multiple vaults.
*   **`vaults.yaml`:** A central file within the application repository (`/data/vaults.yaml`) that lists known vaults, their locations (`owner/repo`), optional base paths within the repo, and metadata.
*   **`basePath`:** An optional configuration for a vault specifying a subdirectory within its GitHub repository that acts as the vault's root for the Opendhamma application. This allows vault content to live alongside other code or documentation in the same repository.
*   **Default Vault:** One vault designated as the default (via `default: true` in `vaults.yaml`), typically used for primary content sections like the `/tipitaka` route.

---

## 2. Getting Started (Developer Setup)

This section guides developers on setting up the project locally.

### Prerequisites

*   **Node.js:** v18.17 or later ([Download](https://nodejs.org/))
*   **pnpm:** v8.0 or later (`npm install -g pnpm`) ([pnpm Website](https://pnpm.io/))
*   **Git:** ([Download](https://git-scm.com/))
*   **GitHub Account:** ([GitHub](https://github.com/))
*   **Code Editor:** (e.g., [VS Code](https://code.visualstudio.com/))
*   **OpenSSL (Optional):** For `AUTH_SECRET` generation (available on Linux/macOS, use Git Bash/WSL on Windows).

### Cloning

Clone the application repository (replace URL if it's the fork or main app repo):

```bash
git clone https://github.com/akosblazsik/opendhamma.org.git
cd opendhamma.org
```

### Installation

Install dependencies using pnpm:

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the project root for storing secrets and configuration.

#### Generate `GITHUB_ID` & `GITHUB_SECRET`

1.  Go to your GitHub Settings -> Developer settings -> OAuth Apps -> New OAuth App.
2.  **Application name:** `Opendhamma Dev Local` (or similar)
3.  **Homepage URL:** `http://localhost:3000`
4.  **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github` (Must be exact)
5.  Click **Register application**.
6.  Copy the **Client ID** shown -> this is `GITHUB_ID`.
7.  Click **Generate a new client secret** -> **COPY THE SECRET IMMEDIATELY** -> this is `GITHUB_SECRET`.

#### Generate `AUTH_SECRET`

1.  Open your terminal/Git Bash/WSL.
2.  Run: `openssl rand -hex 32`
3.  Copy the output string -> this is `AUTH_SECRET`.

#### Generate `GITHUB_TOKEN` (PAT)

1.  Go to GitHub Settings -> Developer settings -> Personal access tokens -> Tokens (classic).
2.  Click **Generate new token** -> **Generate new token (classic)**.
3.  **Note:** `Opendhamma Dev API Access`
4.  **Expiration:** Choose (e.g., 90 days).
5.  **Scopes:** Select **`repo`** (to read private/public content vaults) or at least **`public_repo`** (if *all* content vaults listed in `vaults.yaml` are public).
6.  Click **Generate token**.
7.  **COPY THE TOKEN IMMEDIATELY** -> this is `GITHUB_TOKEN`.

#### Populate `.env.local`

Create the `.env.local` file in your project root and add your generated credentials:

```env
# .env.local - Local Development Environment Variables

# GitHub OAuth App Credentials (for user login)
GITHUB_ID=PASTE_YOUR_CLIENT_ID_HERE
GITHUB_SECRET=PASTE_YOUR_GENERATED_CLIENT_SECRET_HERE

# GitHub Personal Access Token (for app backend to read vault content)
GITHUB_TOKEN=PASTE_YOUR_GENERATED_PERSONAL_ACCESS_TOKEN_HERE

# NextAuth Secret (for session security)
AUTH_SECRET=PASTE_YOUR_GENERATED_OPENSSL_STRING_HERE

# Base URL for NextAuth callbacks
NEXTAUTH_URL=http://localhost:3000

# Optional: Comma-separated list of GitHub emails for Admin access
# ADMIN_EMAILS=your_admin_email@example.com
```

**Do not commit `.env.local`!**

### Vault Configuration (`data/vaults.yaml`)

Configure the content sources:

1.  Edit `data/vaults.yaml`.
2.  Set the `repo:` field for each vault to the correct `owner/repo` on GitHub.
3.  If a vault's content lives in a subdirectory, set the `basePath:` field to that directory's name (e.g., `tipitaka-vault`).
4.  Ensure the vault marked `default: true` points to the intended primary content source.
5.  Verify your `GITHUB_TOKEN` (PAT) has the necessary read permissions (`public_repo` or `repo` scope) for *all* repositories listed in the `repo:` fields.

### Running Locally

Start the Next.js development server:

```bash
pnpm dev
```

Access the application at `http://localhost:3000`. Check the terminal for any errors during startup or page loading.

---

## 3. User Guide

### Browsing Content

*   **Homepage (`/`):** Project overview and entry points.
*   **Tipitaka (`/tipitaka`):** Browse the canonical texts sourced from the *default* vault (defined in `data/vaults.yaml`). Navigation follows Nikaya -> Sutta structure.
*   **Vaults (`/vaults`):** Lists all registered vaults. Clicking a vault name navigates to its root directory view (e.g., `/vaults/opendhamma-tipitaka`).
*   **Vault Browser:** From a vault's root page (`/vaults/[vaultId]`) or any subdirectory page (`/vaults/[vaultId]/[...path]`), you can navigate the vault's structure. Clicking Markdown files (`.md`) displays rendered content.

### Authentication

*   Use the "Sign in with GitHub" button (usually in the header).
*   Authorize the application on GitHub when prompted.
*   Successful login redirects you back to the app, showing your logged-in status.
*   Authentication is required for settings and planned contribution features.

### Settings

*   Navigate to `/settings` (requires login).
*   Currently a placeholder, this section will allow managing user preferences.

---

## 4. Contribution Guide

### Contribution Philosophy

Opendhamma is built on open collaboration using GitHub. Contributions to content vaults are encouraged and managed via standard GitHub workflows for transparency and maintainability. The Opendhamma application displays this content and aims to facilitate contribution.

### Ways to Contribute

*   **Content Corrections:** Fix typos, grammar, facts in texts/translations.
*   **New Translations:** Add translations of canonical texts.
*   **Translation Refinements:** Improve existing translations.
*   **Scholarly Notes:** Add annotations, references (format TBD).
*   **Structuring Content:** Help organize vault files/directories.
*   **Application Development:** Contribute code to the Opendhamma app repository itself.

*This guide focuses on **content contributions** to the vaults.*

### Collaboration Workflows for Content

There are three primary ways to contribute content changes:

#### Workflow 1: Direct GitHub Interaction (Fork & PR / Direct Branching)

Use the GitHub website or local Git tools, independent of the Opendhamma app.

*   **A) Fork & Pull Request (Standard for All Contributors):**
    1.  **Fork:** Fork the main content vault repository (e.g., `akosblazsik/opendhamma`) on GitHub.
    2.  **Clone (Optional):** Clone *your fork* locally. Add original as `upstream`.
    3.  **Branch:** Create a feature branch in your fork (e.g., `fix-sn1.1-pali-typo`). Keep fork's `main` synced with `upstream/main`.
    4.  **Edit:** Make changes in your branch.
    5.  **Commit & Push:** Commit changes and push the branch *to your fork*.
    6.  **Pull Request:** Open a PR from your fork/branch to the `main` branch of the *original* (`upstream`) repository. Add title/description.
    7.  **Review & Merge:** Maintainers review/merge the PR on GitHub.

*   **B) Direct Branching (Core Team / Write Access Only):**
    1.  **Clone (Optional):** Work with a clone of the *main* vault repo.
    2.  **Branch:** Create a feature branch directly off `main`. Keep `main` updated.
    3.  **Edit:** Make changes.
    4.  **Commit & Push:** Commit changes and push the branch *directly to the main repository*. Requires write access.
    5.  **Pull Request:** Open a PR *within the main repository*, comparing your feature branch against `main`.
    6.  **Review & Merge:** Typically reviewed by another team member before merging.

*   **Pros:** Full Git/GitHub power, standard practice.
*   **Cons:** Requires Git/GitHub familiarity.

#### Workflow 2: App-Facilitated GitHub Editing ("Edit on GitHub" Link - Planned Phase 1)

Uses the Opendhamma app as a starting point.

1.  **Navigate in App:** Go to the content page to edit.
2.  **Click "Edit on GitHub":** Find the link (feature is planned). May require app login first.
3.  **Redirect to GitHub:** App sends you to the specific file on GitHub in edit mode.
4.  **GitHub Handles Workflow:** GitHub prompts non-collaborators to **fork**, **branch**, **commit ("Propose changes")**, and **open a Pull Request** back to the original repository.
5.  **Review & Merge:** Maintainers review/merge the PR on GitHub.

*   **Pros:** Lower barrier; no local Git needed; uses GitHub's web flow.
*   **Cons:** Requires GitHub UI interaction; relies on the planned "Edit on GitHub" link feature.

#### Workflow 3: In-App Contribution (Planned - Phase 2)

The app manages Git/GitHub interactions via API. **(Not yet implemented)**

1.  **Authenticate & Grant Permissions:** Log in via GitHub. May need to grant Opendhamma app `repo` scope permissions on first use.
2.  **Edit In-App:** Use an in-app "Edit" button and integrated Markdown editor.
3.  **Submit In-App:** Click "Submit Changes", provide commit/PR details.
4.  **Backend API Calls:** App backend uses *your* OAuth token to: create fork (if needed), create branch on fork, commit changes, create PR to main vault.
5.  **App Feedback:** App confirms PR creation, possibly links to it.
6.  **Review & Merge:** Maintainers review/merge PR on GitHub.

*   **Pros:** Potentially seamless UX.
*   **Cons:** Complex implementation; requires broad user permissions; robust error handling needed.

### General Guidelines

*   **Check Existing Work:** Look at Issues/PRs on the vault repo first.
*   **Clear Communication:** Use descriptive commit messages and PR details.
*   **Atomic Changes:** Keep commits/PRs focused on one logical change.
*   **Stay Updated (Local):** Regularly `git pull upstream main` and merge/rebase feature branches.
*   **Formatting:** Adhere to vault's Markdown/YAML conventions.
*   **Respect Licenses:** Be aware of the specific vault's content license.

---

## 5. Architecture Overview

### Technology Stack

*   **Framework:** Next.js (v15+) App Router
*   **Styling:** Tailwind CSS (v3+) with `@tailwindcss/typography`
*   **Authentication:** NextAuth.js (v4 - GitHub OAuth Provider)
*   **Content Source:** GitHub Repositories (Vaults) via GitHub API v3
*   **GitHub API Client:** Octokit (`@octokit/rest`)
*   **Deployment:** Vercel
*   **Package Manager:** pnpm

### Key Components

*   **Next.js App:** Routing, Rendering (Server/Client Components), API Routes.
*   **`data/vaults.yaml`:** Central vault registry (repo, basePath, metadata).
*   **`lib/vaults.ts`:** Parses/validates `vaults.yaml`.
*   **`lib/github.ts`:** Fetches GitHub content via Octokit using app's `GITHUB_TOKEN`, respects `basePath`.
*   **Dynamic Routes:**
    *   `/tipitaka/...`: Uses default vault.
    *   `/vaults/[vaultId]`: Vault root view.
    *   `/vaults/[vaultId]/[...path]`: Vault sub-path browser/viewer.
*   **Auth:** `/api/auth/[...nextauth]/route.ts` (NextAuth v4 handler), `lib/auth.ts` (shared `authOptions`).

### Authentication Flow (NextAuth v4)

1.  User clicks "Sign in". App redirects to GitHub via NextAuth.
2.  User authorizes GitHub OAuth App.
3.  GitHub redirects to `/api/auth/callback/github`.
4.  NextAuth handler verifies code, gets tokens, creates session/JWT.
5.  User redirected back to app, logged in.
6.  Session managed via JWT; retrieved using `useSession` (client) or `getServerSession(authOptions)` (server).

### Content Fetching (with basePath)

1.  Page determines required `vaultId` and relative `displayPath`.
2.  Gets `vault` config (incl. `repo`, `basePath`) from `lib/vaults.ts`.
3.  Calls `getFileContent(vault.repo, displayPath, vault.basePath)` or `getDirectoryContent(...)`.
4.  `lib/github.ts` calculates `fullRepoPath = joinPaths(vault.basePath, displayPath)`.
5.  Octokit (using app's `GITHUB_TOKEN`) fetches `fullRepoPath` from `vault.repo`.
6.  Page renders content. Links within the page use `displayPath`.

---

## 6. Deployment (Vercel)

### Deployment Prerequisites

*   Vercel Account linked to your GitHub account.
*   Project code pushed to the GitHub repository linked to Vercel.

### Setup Steps

1.  **Import Project:** Import the app repository on Vercel.
2.  **Configure Build Settings (Vercel Project Settings -> General):**
    *   Framework Preset: `Next.js`.
    *   Build Command: Override -> `pnpm build`.
    *   Install Command: Override -> `pnpm install`.
    *   Node.js Version: Select version matching `package.json` `engines` (e.g., `20.x`).
3.  **Configure Environment Variables (Vercel Project Settings -> Environment Variables):** See below.
4.  **Update GitHub OAuth App Callback:** Add Vercel URL. See below.
5.  **Deploy:** Trigger deployment via Git push or Vercel dashboard.
6.  **Verify:** Test deployed site, auth, content loading. Check Vercel logs.

### Vercel Environment Variables

Add these in Vercel project settings, using values generated during local setup:

*   `GITHUB_ID`: (OAuth App Client ID)
*   `GITHUB_SECRET`: (OAuth App Client Secret) - Mark as Secret
*   `AUTH_SECRET`: (Your generated random string) - Mark as Secret
*   `GITHUB_TOKEN`: (Your PAT with `repo` or `public_repo` scope) - Mark as Secret
*   `NEXTAUTH_URL`: **Full HTTPS URL** of your Vercel deployment (e.g., `https://your-app.vercel.app`)
*   `ADMIN_EMAILS` (Optional): Comma-separated admin emails

### Update GitHub OAuth App Callback

Go to your GitHub OAuth App settings and **add** the Vercel callback URL on a new line:

```
http://localhost:3000/api/auth/callback/github
https://<your-vercel-app-url>/api/auth/callback/github
```
Click "Update application".

### Deploy & Verify

Push changes or manually trigger deployment. Test thoroughly.

---

## 7. Future Work & Roadmap

Based on `docs/specs.yml`, planned enhancements include:

*   AI Integrations (Translation drafts, insights, glossary).
*   Advanced Search Capabilities.
*   Annotation and Note-Taking System.
*   Refined Markdown Rendering (TOC, footnotes).
*   Improved UI/UX (e.g., side-by-side views, translation switching).
*   In-App Contribution Workflow (Phase 2).
*   Admin tools for vaults/users.
*   Private vault support.

---

## 8. License

*   **Application Code:** MIT License (Confirm in `LICENSE` file).
*   **Vault Content:** Licenses vary per vault. Check individual vault repositories (e.g., `akosblazsik/opendhamma`) for specific content licenses (Public Domain, Creative Commons, etc.). Contributions should respect these licenses.