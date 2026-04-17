'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { publishServer } from '@/lib/api'
import { CATEGORIES } from '@/lib/categories'

export default function PublishPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    endpoint_url: '',
    auth_type: 'api_key',
    github_url: '',
    docs_url: '',
    pricing_type: 'free',
    price_monthly: '',
    tags: [] as string[],
    logo_url: '',
  })

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim(),
    }))
  }

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...form,
        price_monthly: form.price_monthly ? parseInt(form.price_monthly) * 100 : null,
      }
      const server = await publishServer(payload)
      router.push(`/servers/${server.slug}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to publish server'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5'

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-white mb-2">Publish Your MCP Server</h1>
      <p className="text-gray-400 mb-8">
        Add your server to the registry and make it discoverable by AI agent developers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={labelClass}>Server Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Shopify MCP"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Slug *</label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="e.g. shopify-mcp"
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">Used in the URL: /servers/{form.slug || 'your-slug'}</p>
        </div>

        <div>
          <label className={labelClass}>Description *</label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what your MCP server does..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Category *</label>
          <select
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputClass}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Endpoint URL *</label>
          <input
            type="url"
            required
            value={form.endpoint_url}
            onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })}
            placeholder="https://mcp.example.com/server"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Auth Type *</label>
          <select
            value={form.auth_type}
            onChange={(e) => setForm({ ...form, auth_type: e.target.value })}
            className={inputClass}
          >
            <option value="api_key">API Key</option>
            <option value="oauth">OAuth</option>
            <option value="none">No Auth</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>GitHub URL</label>
            <input
              type="url"
              value={form.github_url}
              onChange={(e) => setForm({ ...form, github_url: e.target.value })}
              placeholder="https://github.com/..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Docs URL</label>
            <input
              type="url"
              value={form.docs_url}
              onChange={(e) => setForm({ ...form, docs_url: e.target.value })}
              placeholder="https://docs.example.com"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Pricing</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, pricing_type: 'free' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.pricing_type === 'free'
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, pricing_type: 'paid' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.pricing_type === 'paid'
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              Paid
            </button>
          </div>
          {form.pricing_type === 'paid' && (
            <input
              type="number"
              min="0"
              value={form.price_monthly}
              onChange={(e) => setForm({ ...form, price_monthly: e.target.value })}
              placeholder="Price per month (USD)"
              className={`${inputClass} mt-3`}
            />
          )}
        </div>

        <div>
          <label className={labelClass}>Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-800 text-gray-300 text-sm px-2 py-1 rounded-lg flex items-center gap-1"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-gray-500 hover:text-white">
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Type a tag and press Enter"
            className={inputClass}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Publishing...' : 'Publish Server'}
        </button>
      </form>
    </div>
  )
}
