// tailwind.config.ts
import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors' // Import colors for easier reference

const config: Config = {
    content: [
        // Adjust paths if your structure differs
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'media', // Use OS preference for dark mode
    theme: {
        extend: {
            fontFamily: {
                // Use the CSS variables defined in globals.css & layout.tsx
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-geist-mono)', 'monospace'],
            },
            colors: {
                // Define primary/accent colors (example using blue)
                primary: colors.blue,
                // Background and foreground based on CSS variables
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                // Define border color for consistency
                border: colors.neutral[300],
                darkborder: colors.neutral[700],
                // Add specific colors if needed
                // e.g., codeblockbg: colors.neutral[800],
            },
            // Example: Add spacing or other theme customizations
            // spacing: {
            //   '128': '32rem',
            // }
        },
    },
    plugins: [
        require('@tailwindcss/typography'), // Essential for styling markdown output
        // require('@tailwindcss/forms'), // Uncomment if you add forms later
    ],
}
export default config