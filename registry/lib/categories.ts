export interface Category {
  slug: string
  label: string
  description: string
  icon: string
}

export const CATEGORIES: Category[] = [
  { slug: 'ecommerce', label: 'E-commerce', description: 'Shopify, WooCommerce, inventory management', icon: '🛍️' },
  { slug: 'payments', label: 'Payments', description: 'Stripe, PayPal, billing automation', icon: '💳' },
  { slug: 'crm', label: 'CRM', description: 'HubSpot, Salesforce, customer management', icon: '👥' },
  { slug: 'analytics', label: 'Analytics', description: 'GA4, Mixpanel, data insights', icon: '📊' },
  { slug: 'hr', label: 'HR & Recruiting', description: 'ATS integrations, candidate screening', icon: '🤝' },
  { slug: 'devtools', label: 'Dev Tools', description: 'GitHub, Vercel, CI/CD', icon: '⚙️' },
  { slug: 'communication', label: 'Communication', description: 'Slack, Gmail, Telegram', icon: '💬' },
  { slug: 'productivity', label: 'Productivity', description: 'Notion, Airtable, task management', icon: '✅' },
]
