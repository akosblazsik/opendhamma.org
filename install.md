Okay, I've updated the Installation Guide to include the specific steps for generating the `AUTH_SECRET`, `GITHUB_ID`, and `GITHUB_SECRET` within the environment variable configuration sections.

```markdown
# Opendhamma Installation Guide

This guide provides instructions for setting up the Opendhamma project for local development and configuring automatic deployment to Vercel.

## I. Prerequisites

Before you begin, ensure you have the following installed and set up:

1.  **Node.js:** Version 18.17 or later. ([Download](https://nodejs.org/))
2.  **pnpm:** Recommended package manager. Install via `npm install -g pnpm`. ([pnpm Website](https://pnpm.io/))
3.  **Git:** For cloning the repository. ([Download](https://git-scm.com/))
4.  **GitHub Account:** Required for OAuth authentication and hosting vault repositories. ([GitHub](https://github.com/))
5.  **Code Editor:** A code editor like VS Code is recommended. ([Download VS Code](https://code.visualstudio.com/))
6.  **Vercel Account (for Deployment):** Sign up for a free account and link it to your GitHub account. ([Vercel](https://vercel.com/))
7.  **OpenSSL (Optional but Recommended):** For generating the `AUTH_SECRET`. Available on most Linux/macOS systems. Windows users can use Git Bash or WSL.

---

## II. Local Development Setup

Follow these steps to run the project on your local machine.

**1. Clone the Repository:**

   Open your terminal or command prompt and clone the project repository:

   ```bash
   # Replace with the actual repository URL if it's different
   git clone https://github.com/your-username/opendhamma.org.git
   cd opendhamma.org
   ```

**2. Install Dependencies:**

   Use pnpm to install all necessary project dependencies listed in `package.json`:

   ```bash
   pnpm install
   ```

**3. Configure Environment Variables:**

   This step is crucial for authentication and accessing GitHub data.

   a.  Create a file named `.env.local` in the root directory of the project (the same level as `package.json`).

   b.  **Generate `GITHUB_ID` and `GITHUB_SECRET`:**
      *   Log in to your GitHub account.
      *   Go to **Settings** -> **Developer settings** -> **OAuth Apps**.
      *   Click the **"New OAuth App"** button.
      *   Fill in the details:
         *   **Application name:** `Opendhamma Dev Local` (or similar)
         *   **Homepage URL:** `http://localhost:3000`
         *   **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github` *(Ensure this matches exactly)*
      *   Click **"Register application"**.
      *   On the next page, you will see the **Client ID**. Copy this value – this is your `GITHUB_ID`.
      *   Click the **"Generate a new client secret"** button.
      *   **COPY THE GENERATED SECRET IMMEDIATELY.** You won't see it again. This is your `GITHUB_SECRET`.

   c.  **Generate `AUTH_SECRET`:**
      *   This secret is used by NextAuth.js to encrypt session tokens (JWTs). It should be a strong, random string.
      *   Open your terminal (or Git Bash/WSL on Windows) and run the following command:
         ```bash
         openssl rand -hex 32
         ```
      *   Copy the long hexadecimal string that is output. This is your `AUTH_SECRET`. (Alternatively, use a secure password generator for a 32+ character string).

   d.  **Generate `GITHUB_TOKEN` (Personal Access Token):**
      *   This token is used by the application's backend (via Octokit) to fetch content from GitHub repositories (vaults). It's separate from the user login flow.
      *   Go to GitHub **Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
      *   Click **"Generate new token"** -> **"Generate new token (classic)"**.
      *   **Note:** Give it a descriptive name (e.g., `opendhamma-dev-api`).
      *   **Expiration:** Choose an appropriate expiration (e.g., 30 days, 90 days, or custom).
      *   **Scopes:** Select the necessary permissions. For reading public and private vaults, select the **`repo`** scope. If you only need to read *public* vaults, select `public_repo`.
      *   Click **"Generate token"**.
      *   **COPY THE GENERATED TOKEN IMMEDIATELY.** You won't see it again. This is your `GITHUB_TOKEN`.

   e.  **Populate `.env.local`:** Add the generated values to your `.env.local` file:

      ```env
      # .env.local - Local Development Environment Variables

      # GitHub OAuth App Credentials (for user login - Step 3b)
      GITHUB_ID=PASTE_YOUR_CLIENT_ID_HERE
      GITHUB_SECRET=PASTE_YOUR_GENERATED_CLIENT_SECRET_HERE

      # GitHub Personal Access Token (for fetching repo content via API - Step 3d)
      GITHUB_TOKEN=PASTE_YOUR_GENERATED_PERSONAL_ACCESS_TOKEN_HERE

      # NextAuth Secret (generated string for session security - Step 3c)
      AUTH_SECRET=PASTE_YOUR_GENERATED_OPENSSL_STRING_HERE

      # Base URL for NextAuth callbacks (must match host)
      NEXTAUTH_URL=http://localhost:3000

      # Optional: Comma-separated list of GitHub emails for Admin access (used later)
      # ADMIN_EMAILS=your_admin_email@example.com
      ```

   f.  **Security Note:** **Never** commit your `.env.local` file to Git. The included `.gitignore` file should prevent this automatically.

**4. Configure Vaults:**

   The application loads content from GitHub repositories defined as "vaults".

   a.  Open the `data/vaults.yaml` file.
   b.  Update the `repo:` field for at least the vault marked `default: true` to point to an *actual* GitHub repository (in `owner/repo` format) that your `GITHUB_TOKEN` has access to.
   c.  Ensure the target repository contains some Markdown files, ideally following the project's expected structure (e.g., a `tipitaka/` directory).

**5. Run the Development Server:**

   Start the Next.js development server:

   ```bash
   pnpm dev
   ```

   The application should now be running at `http://localhost:3000`.

**6. Verify Local Setup:**

   *   Open `http://localhost:3000`. Test Sign in / Sign out via GitHub.
   *   Navigate to `/tipitaka` and `/vaults` to ensure content loads from your configured repositories. Check the terminal for errors if content doesn't load.

---

## III. Vercel Automatic Deployment

Follow these steps to deploy the project to Vercel and enable automatic deployments from GitHub.

**1. Push Project to GitHub:**

   Ensure your project code (including `data/vaults.yaml`, `next.config.ts`, etc., but **not** `.env.local`) is pushed to a GitHub repository linked to your Vercel account.

   ```bash
   # Add, commit, and push your changes if you haven't already
   git add .
   git commit -m "feat: Prepare for Vercel deployment"
   git push origin main
   ```

**2. Import Project on Vercel:**

   a.  Log in to your Vercel dashboard.
   b.  Click "Add New..." -> "Project".
   c.  Import the correct GitHub repository.

**3. Configure Vercel Project Settings:**

   Verify or set the following:

   *   **Framework Preset:** Next.js
   *   **Root Directory:** `./`
   *   **Build Command:** Override if necessary: `pnpm build`
   *   **Install Command:** Override if necessary: `pnpm install`

**4. Configure Environment Variables on Vercel:**

   This mirrors the local setup but uses Vercel's UI and requires the *production URL* for `NEXTAUTH_URL`.

   a.  In your Vercel project dashboard, go to **Settings** -> **Environment Variables**.
   b.  Add the following variables, using the **same values** you generated for your local `.env.local` file **EXCEPT** for `NEXTAUTH_URL`:

      *   `GITHUB_ID`: (Your GitHub OAuth App Client ID - **same as local**)
      *   `GITHUB_SECRET`: (Your GitHub OAuth App Client Secret - **same as local**)
      *   `AUTH_SECRET`: (Your generated NextAuth secret - **same as local**)
      *   `GITHUB_TOKEN`: (Your GitHub Personal Access Token - **same as local**)
      *   `NEXTAUTH_URL`: **IMPORTANT:** Set this to the **full HTTPS URL** of your Vercel deployment (e.g., `https://your-app-name.vercel.app`). You can find this URL on your Vercel project dashboard.
      *   `ADMIN_EMAILS` (Optional): Add if configured.

   c.  Ensure you select the appropriate environments (Production, Preview, Development) for each variable. Secrets like `GITHUB_SECRET`, `AUTH_SECRET`, `GITHUB_TOKEN` should **not** be exposed to the browser (leave "Type" as "Secret").

**5. Update GitHub OAuth App Callback URL:**

   Allow GitHub to redirect back to your Vercel deployment after login.

   a.  Go back to your GitHub OAuth App settings (Developer settings -> OAuth Apps -> Your App).
   b.  In the "Authorization callback URL" field, **add** your Vercel production callback URL **on a new line**. Keep the `localhost` one for local development.
      *   Add: `https://your-app-name.vercel.app/api/auth/callback/github` (Replace with your actual Vercel URL)
   c.  Click "Update application".

**6. Deploy:**

   a.  Click the "Deploy" button in Vercel if this is the first deployment.
   b.  Future pushes to the connected branch (e.g., `main`) will automatically trigger new deployments.

**7. Verify Deployment:**

   a.  Visit your Vercel URL (`https://your-app-name.vercel.app`).
   b.  Test the authentication flow thoroughly.
   c.  Verify vault content loads correctly.
   d.  Check Vercel deployment logs for any errors.

---

## IV. Post-Setup & Next Steps

*   **Vault Content:** Ensure the GitHub repositories configured as vaults contain actual Markdown content in the expected structure.
*   **Develop Features:** Continue building out the application features.
*   **Styling:** Refine the UI and styling.
*   **Error Handling & Loading States:** Implement more robust feedback.
*   **Testing:** Add tests.
```