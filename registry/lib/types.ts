export interface RegistryServer {
  id: string
  org_id: string | null
  name: string
  slug: string
  description: string
  category: string
  endpoint_url: string
  auth_type: 'api_key' | 'oauth' | 'none'
  schema_json: Record<string, unknown> | null
  version: string
  is_public: boolean
  is_verified: boolean
  install_count: number
  rating_avg: number
  pricing_type: 'free' | 'paid'
  price_monthly: number | null
  logo_url: string | null
  tags: string[] | null
  github_url: string | null
  docs_url: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface ConnectResponse {
  data: {
    server: RegistryServer
    config: Record<string, unknown>
    instructions: {
      claude_desktop: string
      cursor: string
    }
  }
}
