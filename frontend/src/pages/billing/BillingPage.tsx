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


const PLAN_ORDER = ['free', 'starter', 'growth', 'business'] as const

const PLAN_COLORS: Record<string, { badge: string; accent: string }> = {
  free: { badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', accent: 'text-zinc-400' },
  starter: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', accent: 'text-blue-400' },
  growth: { badge: 'bg-brand-500/10 text-brand-400 border-brand-500/20', accent: 'text-brand-400' },
  business: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', accent: 'text-amber-400' },
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing</h1>
          <p className="text-zinc-400 mt-1">Manage your subscription and billing</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const currentPlan = subscription?.plan.name ?? 'free'
  const currentIdx = PLAN_ORDER.indexOf(currentPlan as (typeof PLAN_ORDER)[number])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Billing</h1>
        <p className="text-zinc-400 mt-1">Manage your subscription, usage, and invoices</p>
      </div>

      {/* Current plan + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CurrentPlanCard subscription={subscription} currentPlan={currentPlan} />
        <UsageCard
          label="Services"
          used={usage?.services_used ?? 0}
          limit={usage?.services_limit}
          icon={<Zap className="w-4 h-4 text-brand-400" />}
          color="brand"
        />
        <UsageCard
          label="Tool Calls"
          used={usage?.calls_used ?? 0}
          limit={usage?.calls_limit}
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
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
        <h2 className="text-base font-semibold text-white mb-4">Plans</h2>
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
          <h2 className="text-base font-semibold text-white mb-4">Invoice History</h2>
          <div className="rounded-xl border border-zinc-800 bg-surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-xs font-medium text-zinc-400 px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-zinc-400 px-6 py-3">Amount</th>
                    <th className="text-left text-xs font-medium text-zinc-400 px-6 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-zinc-400 px-6 py-3">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: Invoice) => (
                    <tr key={invoice.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                      <td className="px-6 py-3 text-zinc-300">
                        {invoice.created_at
                          ? new Date(invoice.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-3 text-white font-medium">
                        ${invoice.amount.toFixed(2)} {invoice.currency}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {invoice.invoice_url ? (
                          <a
                            href={invoice.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manage subscription */}
      {subscription && subscription.plan.name !== 'free' && (
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Manage Subscription</h2>
          <div className="rounded-xl border border-zinc-800 bg-surface-card p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white font-medium">Subscription management</p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Manage your payment details and subscription through Freemius
                </p>
              </div>
              <CancelButton subscription={subscription} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
    <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-zinc-400">Current Plan</span>
        <Badge variant="outline" className={`text-xs ${colors.badge}`}>
          {currentPlan}
        </Badge>
      </div>

      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-3xl font-bold text-white">
          {subscription?.plan.price ? `$${subscription.plan.price}` : '$0'}
        </span>
        <span className="text-sm text-zinc-500">
          {subscription?.plan.price ? '/month' : 'forever'}
        </span>
      </div>

      {subscription?.status === 'active' && subscription.cancel_at_period_end && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 mb-3">
          <p className="text-xs text-amber-400 font-medium">
            Cancels on {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
          <button
            onClick={() => {
              resume.mutate(undefined, {
                onSuccess: () => toast.success('Subscription resumed'),
                onError: () => toast.error('Failed to resume'),
              })
            }}
            className="text-xs text-amber-300 underline mt-1 hover:no-underline"
            disabled={resume.isPending}
          >
            {resume.isPending ? 'Resuming...' : 'Resume subscription'}
          </button>
        </div>
      )}

      {subscription?.status === 'past_due' && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 mb-3">
          <p className="text-xs text-red-400 font-medium">
            Payment failed — please update your card
          </p>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        {subscription?.plan.display_name ?? 'Free'} plan
        {subscription?.current_period_end && (
          <> · Renews {new Date(subscription.current_period_end).toLocaleDateString()}</>
        )}
      </p>
    </div>
  )
}

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
  color: 'brand' | 'emerald'
  subtitle?: string
}) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0
  const isWarning = pct >= 80
  const isCritical = pct >= 95

  const barColor = isCritical
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-500'
      : color === 'brand'
        ? 'bg-brand-500'
        : 'bg-emerald-500'

  return (
    <div className="rounded-xl border border-zinc-800 bg-surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        {icon}
      </div>

      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-3xl font-bold text-white">{used.toLocaleString()}</span>
        {limit && <span className="text-sm text-zinc-500">/ {limit.toLocaleString()}</span>}
        {!limit && <span className="text-sm text-zinc-500">/ unlimited</span>}
      </div>

      {limit && (
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-zinc-500">{pct.toFixed(0)}% used</p>
            {subtitle && <p className="text-xs text-zinc-600">{subtitle}</p>}
          </div>
          {isWarning && !isCritical && (
            <p className="text-xs text-amber-400 font-medium mt-1">
              Approaching limit — consider upgrading
            </p>
          )}
          {isCritical && (
            <p className="text-xs text-red-400 font-medium mt-1">
              Almost at limit — upgrade to continue
            </p>
          )}
        </div>
      )}
    </div>
  )
}

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
    <div
      className={`relative rounded-xl border bg-surface-card overflow-hidden transition-all ${
        isCurrent ? 'border-brand-500/40 ring-1 ring-brand-500/20' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {isGrowth && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      )}
      <div className="p-5">
        <div className="mb-4">
          {isGrowth && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full mb-2">
              <Sparkles className="w-3 h-3" />
              Popular
            </span>
          )}
          <h3 className="text-sm font-semibold text-white">{plan.display_name}</h3>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">
              {plan.price ? `$${plan.price}` : '$0'}
            </span>
            <span className="text-xs text-zinc-500">{plan.price ? '/mo' : 'forever'}</span>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          <div className="text-xs text-zinc-500 font-medium mb-1">
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
              <span className="text-zinc-400">{f}</span>
            </div>
          ))}
        </div>

        {isCurrent ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-zinc-700 text-zinc-500"
            disabled
          >
            Current plan
          </Button>
        ) : plan.name === 'free' ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-zinc-700 text-zinc-500"
            disabled
          >
            Free tier
          </Button>
        ) : (
          <Button
            size="sm"
            className={`w-full gap-1.5 ${
              isGrowth
                ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            }`}
            onClick={handleAction}
          >
            {isUpgrade ? (
              <>Upgrade <ArrowUpRight className="w-3.5 h-3.5" /></>
            ) : isDowngrade ? (
              'Downgrade'
            ) : (
              <>Get started <ArrowRight className="w-3.5 h-3.5" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

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
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          Cancel plan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-surface-card border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Cancel subscription?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Your {subscription.plan.display_name} plan will remain active until{' '}
            {new Date(subscription.current_period_end).toLocaleDateString()}. After that,
            you&apos;ll be downgraded to the Free plan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            Keep my plan
          </AlertDialogCancel>
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
