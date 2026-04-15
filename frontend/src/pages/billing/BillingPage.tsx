import {
  useCancelSubscription,
  useCheckoutConfig,
  useInvoices,
  usePlans,
  useResumeSubscription,
  useSubscription,
  useUsage,
} from '@/api/billing'
import type { Invoice, Plan } from '@/api/billing'
import { useCurrentUser } from '@/api/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ExternalLink,
  FileText,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/* ─── Freemius checkout type ─── */
interface FreemiusCheckoutInstance {
  open: (opts: {
    name?: string
    licenses?: number
    billing_cycle?: 'monthly' | 'annual' | 'lifetime'
    user_email?: string
    user_firstname?: string
    readonly_user?: boolean
    sandbox?: { token: string; ctx: string }
    success?: (data: Record<string, unknown>) => void
    purchaseCompleted?: (data: Record<string, unknown>) => void
    cancel?: () => void
    afterClose?: () => void
  }) => void
  close: () => void
}

declare global {
  interface Window {
    FS: {
      Checkout: new (config: {
        product_id: string
        plan_id: number
        public_key: string
        image?: string
      }) => FreemiusCheckoutInstance
    }
  }
}

const PLAN_ORDER = ['free', 'starter', 'growth', 'business'] as const

const PLAN_COLORS: Record<string, { badge: string; accent: string; bg: string }> = {
  free: { badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', accent: 'text-zinc-400', bg: 'from-zinc-500/10 to-zinc-600/5' },
  starter: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', accent: 'text-blue-400', bg: 'from-blue-500/10 to-blue-600/5' },
  growth: { badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', accent: 'text-indigo-400', bg: 'from-indigo-500/10 to-indigo-600/5' },
  business: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', accent: 'text-amber-400', bg: 'from-amber-500/10 to-amber-600/5' },
}

export function BillingPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription()
  const { data: usage, isLoading: usageLoading } = useUsage()
  const { data: plans = [] } = usePlans()
  const { data: checkoutConfig } = useCheckoutConfig()
  const { data: invoices = [] } = useInvoices()
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()

  const openCheckout = useCallback(
    (freemiusPlanId: string) => {
      if (!checkoutConfig || !window.FS) {
        toast.error('Checkout not ready — please try again')
        return
      }

      const handler = new window.FS.Checkout({
        product_id: checkoutConfig.product_id,
        plan_id: Number(freemiusPlanId),
        public_key: checkoutConfig.public_key,
      })

      handler.open({
        name: 'MCPify',
        licenses: 1,
        billing_cycle: 'monthly',
        user_email: user?.email,
        user_firstname: user?.name?.split(' ')[0],
        ...(checkoutConfig.sandbox ? { sandbox: checkoutConfig.sandbox } : {}),
        purchaseCompleted: () => {
          toast.success('Subscription activated!')
          void queryClient.invalidateQueries({ queryKey: ['billing'] })
        },
        success: () => {
          void queryClient.invalidateQueries({ queryKey: ['billing'] })
        },
        cancel: () => {
          toast.info('Checkout cancelled')
        },
      })
    },
    [checkoutConfig, user, queryClient],
  )

  if (subLoading || usageLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-500 mt-1">Manage your subscription and billing</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const currentPlan = subscription?.plan.name ?? 'free'
  const currentIdx = PLAN_ORDER.indexOf(currentPlan as (typeof PLAN_ORDER)[number])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription, usage, and invoices</p>
      </div>

      {/* Current plan + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CurrentPlanCard subscription={subscription} currentPlan={currentPlan} />
        <UsageCard
          label="Services"
          used={usage?.services_used ?? 0}
          limit={usage?.services_limit}
          icon={<Zap className="w-4 h-4" />}
          color="indigo"
        />
        <UsageCard
          label="Tool Calls"
          used={usage?.calls_used ?? 0}
          limit={usage?.calls_limit}
          icon={<TrendingUp className="w-4 h-4" />}
          color="emerald"
          subtitle={
            usage
              ? `Resets ${new Date(usage.period_end).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}`
              : undefined
          }
        />
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.name === currentPlan}
              isUpgrade={PLAN_ORDER.indexOf(plan.name as (typeof PLAN_ORDER)[number]) > currentIdx}
              isDowngrade={PLAN_ORDER.indexOf(plan.name as (typeof PLAN_ORDER)[number]) < currentIdx}
              onCheckout={openCheckout}
            />
          ))}
        </div>
      </div>

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Amount</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
                      <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice: Invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-6 py-3 text-gray-900">
                          {invoice.created_at
                            ? new Date(invoice.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-6 py-3 text-gray-900 font-medium">
                          ${invoice.amount.toFixed(2)} {invoice.currency}
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-right">
                          {invoice.invoice_url ? (
                            <a
                              href={invoice.invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manage subscription */}
      {subscription && subscription.plan.name !== 'free' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Subscription</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-900 font-medium">Subscription management</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Manage your payment details and subscription through Freemius
                  </p>
                </div>
                <CancelButton subscription={subscription} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

/* ─── Current plan card ─── */
function CurrentPlanCard({
  subscription,
  currentPlan,
}: {
  subscription: ReturnType<typeof useSubscription>['data']
  currentPlan: string
}) {
  const colors = PLAN_COLORS[currentPlan] ?? PLAN_COLORS.free
  const resume = useResumeSubscription()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">Current Plan</CardTitle>
          <Badge variant="outline" className={colors.badge}>
            {currentPlan}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-3xl font-bold text-gray-900">
            {subscription?.plan.price ? `$${subscription.plan.price}` : '$0'}
          </span>
          <span className="text-sm text-gray-500">
            {subscription?.plan.price ? '/month' : 'forever'}
          </span>
        </div>

        {subscription?.status === 'active' && subscription.cancel_at_period_end && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-3">
            <p className="text-xs text-amber-700 font-medium">
              Cancels on {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
            <button
              onClick={() => {
                resume.mutate(undefined, {
                  onSuccess: () => toast.success('Subscription resumed'),
                  onError: () => toast.error('Failed to resume'),
                })
              }}
              className="text-xs text-amber-800 underline mt-1 hover:no-underline"
              disabled={resume.isPending}
            >
              {resume.isPending ? 'Resuming...' : 'Resume subscription'}
            </button>
          </div>
        )}

        {subscription?.status === 'past_due' && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-3">
            <p className="text-xs text-red-700 font-medium">
              Payment failed — please update your card
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500">
          {subscription?.plan.display_name ?? 'Free'} plan
          {subscription?.current_period_end && (
            <> · Renews {new Date(subscription.current_period_end).toLocaleDateString()}</>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

/* ─── Usage progress card ─── */
function UsageCard({
  label,
  used,
  limit,
  icon,
  color,
  subtitle,
}: {
  label: string
  used: number
  limit: number | null | undefined
  icon: React.ReactNode
  color: 'indigo' | 'emerald'
  subtitle?: string
}) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0
  const isWarning = pct >= 80
  const isCritical = pct >= 95

  const barColor = isCritical
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-500'
      : color === 'indigo'
        ? 'bg-indigo-500'
        : 'bg-emerald-500'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-3xl font-bold text-gray-900">{used.toLocaleString()}</span>
          {limit && <span className="text-sm text-gray-500">/ {limit.toLocaleString()}</span>}
          {!limit && <span className="text-sm text-gray-500">/ unlimited</span>}
        </div>

        {limit && (
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-gray-500">{pct.toFixed(0)}% used</p>
              {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
            {isWarning && !isCritical && (
              <p className="text-xs text-amber-600 font-medium mt-1">
                Approaching limit — consider upgrading
              </p>
            )}
            {isCritical && (
              <p className="text-xs text-red-600 font-medium mt-1">
                Almost at limit — upgrade to continue
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Plan card ─── */
function PlanCard({
  plan,
  isCurrent,
  isUpgrade,
  isDowngrade,
  onCheckout,
}: {
  plan: Plan
  isCurrent: boolean
  isUpgrade: boolean
  isDowngrade: boolean
  onCheckout: (freemiusPlanId: string) => void
}) {
  const colors = PLAN_COLORS[plan.name] ?? PLAN_COLORS.free
  const isGrowth = plan.name === 'growth'

  const handleAction = () => {
    if (!plan.freemius_plan_id) return
    onCheckout(plan.freemius_plan_id)
  }

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        isCurrent ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
      } ${isGrowth ? 'border-indigo-200' : ''}`}
    >
      {isGrowth && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      )}
      <CardContent className="p-5">
        <div className="mb-4">
          {isGrowth && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-2">
              <Sparkles className="w-3 h-3" />
              Popular
            </span>
          )}
          <h3 className="text-base font-semibold text-gray-900">{plan.display_name}</h3>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">
              {plan.price ? `$${plan.price}` : '$0'}
            </span>
            <span className="text-xs text-gray-500">{plan.price ? '/mo' : 'forever'}</span>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          <div className="text-xs text-gray-500 font-medium mb-1">
            {plan.limits.services
              ? `${plan.limits.services} service${plan.limits.services > 1 ? 's' : ''}`
              : 'Unlimited services'}
            {' · '}
            {plan.limits.calls_per_month
              ? `${plan.limits.calls_per_month.toLocaleString()} calls/mo`
              : 'Unlimited calls'}
          </div>
          {plan.features.map((f) => (
            <div key={f} className="flex items-start gap-2 text-xs">
              <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${colors.accent}`} />
              <span className="text-gray-600">{f}</span>
            </div>
          ))}
        </div>

        {isCurrent ? (
          <Button variant="outline" size="sm" className="w-full" disabled>
            Current plan
          </Button>
        ) : plan.name === 'free' ? (
          <Button variant="outline" size="sm" className="w-full" disabled>
            Free tier
          </Button>
        ) : (
          <Button
            size="sm"
            className={`w-full gap-1.5 ${
              isGrowth
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            }`}
            onClick={handleAction}
          >
            {isUpgrade ? (
              <>
                Upgrade <ArrowUpRight className="w-3.5 h-3.5" />
              </>
            ) : isDowngrade ? (
              'Downgrade'
            ) : (
              <>
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Cancel button with confirmation ─── */
function CancelButton({
  subscription,
}: {
  subscription: NonNullable<ReturnType<typeof useSubscription>['data']>
}) {
  const cancel = useCancelSubscription()

  if (subscription.cancel_at_period_end) return null

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          Cancel plan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            Your {subscription.plan.display_name} plan will remain active until{' '}
            {new Date(subscription.current_period_end).toLocaleDateString()}. After that,
            you&apos;ll be downgraded to the Free plan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep my plan</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-500 text-white"
            onClick={() => {
              cancel.mutate(undefined, {
                onSuccess: () => toast.success('Subscription will cancel at end of period'),
                onError: () => toast.error('Failed to cancel'),
              })
            }}
            disabled={cancel.isPending}
          >
            {cancel.isPending ? 'Cancelling...' : 'Yes, cancel'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
