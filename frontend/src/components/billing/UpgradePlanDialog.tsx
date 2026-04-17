import { useCheckoutConfig, usePlans } from '@/api/billing'
import { useCurrentUser } from '@/api/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'


interface UpgradePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: 'services' | 'calls'
  current: number
  limit: number
}

export function UpgradePlanDialog({
  open,
  onOpenChange,
  resource,
  current,
  limit,
}: UpgradePlanDialogProps) {
  const { data: plans = [] } = usePlans()
  const { data: checkoutConfig } = useCheckoutConfig()
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const resourceLabel = resource === 'services' ? 'services' : 'monthly tool calls'
  const upgradePlans = plans.filter((p) => {
    const planLimit = resource === 'services' ? p.limits.services : p.limits.calls_per_month
    return planLimit === null || (planLimit !== null && planLimit > limit)
  })

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
          onOpenChange(false)
        },
        success: () => {
          void queryClient.invalidateQueries({ queryKey: ['billing'] })
          onOpenChange(false)
        },
      })
    },
    [checkoutConfig, user, queryClient, onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Upgrade Required
          </DialogTitle>
          <DialogDescription>
            You've reached your {resourceLabel} limit ({current}/{limit}).
            Upgrade your plan to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {upgradePlans.map((plan) => {
            const planLimit =
              resource === 'services' ? plan.limits.services : plan.limits.calls_per_month

            return (
              <div
                key={plan.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{plan.display_name}</p>
                  <p className="text-xs text-gray-500">
                    {planLimit ? `${planLimit.toLocaleString()} ${resourceLabel}` : `Unlimited ${resourceLabel}`}
                    {' · '}${plan.price}/mo
                  </p>
                </div>
                {plan.freemius_plan_id ? (
                  <Button
                    size="sm"
                    className="gap-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                    onClick={() => openCheckout(plan.freemius_plan_id!)}
                  >
                    Upgrade <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500"
            onClick={() => {
              onOpenChange(false)
              navigate('/billing')
            }}
          >
            View all plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
