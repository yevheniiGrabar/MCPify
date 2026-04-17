import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'MCP Registry — Find MCP Servers for AI Agents',
  description: 'The largest registry of MCP servers. Connect your AI agents to Shopify, Stripe, GitHub, and 100+ services.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-lg tracking-tight">
                  <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">mcp</span>
                  <span className="text-gray-500 font-light">/</span>
                  <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">registry</span>
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Discover
                </Link>
                <Link href="/publish" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Publish
                </Link>
                <Link href="https://mpcify.vercel.app" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Docs
                </Link>
              </nav>
              <Link
                href="/publish"
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Publish Your Server
              </Link>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-gray-800 mt-24 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} mcpfy. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
