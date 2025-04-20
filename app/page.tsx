// app/page.tsx
// This is now the main landing page as per specs.yml route: /
import { AuthStatus } from '@/components/AuthButtons';
import Link from 'next/link';
import { BookOpenText, Github, Network, Settings, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      <header className="px-6 py-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* <img src="/logo.svg" alt="Opendhamma Logo" className="h-8 w-8" /> Placeholder */}
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Opendhamma</span>
        </div>
        <nav className="flex items-center space-x-4">
          <Link href="/tipitaka" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">Tipitaka</Link>
          <Link href="/vaults" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400">Vaults</Link>
          {/* Add links to other sections like /app/ai-lab later */}
          <AuthStatus />
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-6 py-12 md:py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight leading-tight text-gray-900 dark:text-white">
          Opendhamma
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
          An AI-enhanced, GitHub-native knowledge & translation system for dharmic teachings.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
          <Link href="/tipitaka" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition duration-150 ease-in-out">
            Explore the Tipitaka
          </Link>
          <a href="https://github.com/opendhamma" target="_blank" rel="noopener noreferrer" className="flex items-center px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold shadow-md transition duration-150 ease-in-out">
            <Github size={20} className="mr-2" />
            View on GitHub
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <BookOpenText className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Canonical Texts</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Access Pali Canon scriptures with multiple translations, stored transparently in GitHub.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Network className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Vault System</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your own GitHub repositories as personal knowledge vaults or contribute to community vaults.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Users className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Collaborative & AI Tools</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Leverage AI for translation drafts, insights, and collaborate on refining wisdom for a modern world. (Coming Soon)
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 border-t border-gray-300 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        Opendhamma Project | MIT License (Code) | Content licenses vary per vault.
      </footer>
    </div>
  );
}