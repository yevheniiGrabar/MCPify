import axios from 'axios'
import type { ConnectResponse, PaginatedResponse, RegistryServer } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

const client = axios.create({ baseURL: API_URL })

export interface ServersParams {
  category?: string
  search?: string
  pricing?: string
  sort?: string
  page?: number
}

export async function fetchServers(params: ServersParams = {}): Promise<PaginatedResponse<RegistryServer>> {
  const { data } = await client.get<PaginatedResponse<RegistryServer>>('/registry/servers', { params })
  return data
}

export async function fetchServer(slug: string): Promise<RegistryServer> {
  const { data } = await client.get<{ data: RegistryServer }>(`/registry/servers/${slug}`)
  return data.data
}

export async function connectServer(slug: string): Promise<ConnectResponse> {
  const { data } = await client.post<ConnectResponse>(`/registry/servers/${slug}/connect`)
  return data
}

export async function fetchCategories(): Promise<{ category: string; count: number }[]> {
  const { data } = await client.get<{ data: { category: string; count: number }[] }>('/registry/categories')
  return data.data
}

export async function publishServer(payload: Record<string, unknown>): Promise<RegistryServer> {
  const { data } = await client.post<{ data: RegistryServer }>('/registry/servers', payload)
  return data.data
}
