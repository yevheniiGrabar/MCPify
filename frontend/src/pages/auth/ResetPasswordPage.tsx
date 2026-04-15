import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import client from '@/api/client'

const schema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await client.post('/api/v1/auth/reset-password', { ...data, token })
      toast.success('Password reset successfully')
      void navigate('/login')
    } catch {
      toast.error('Unable to reset password. The link may have expired.')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden p-6">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-brand-600/8 rounded-full blur-[140px]" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">MCPify</span>
        </Link>

        <div className="rounded-2xl border border-zinc-800 bg-surface-card p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
            <p className="text-zinc-400 text-sm">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-brand-500 focus:ring-brand-500/20"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300 text-sm">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-brand-500 focus:ring-brand-500/20"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation" className="text-zinc-300 text-sm">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="••••••••"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-brand-500 focus:ring-brand-500/20"
                {...register('password_confirmation')}
              />
              {errors.password_confirmation && (
                <p className="text-sm text-red-400">{errors.password_confirmation.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30 group"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : (
                <span className="flex items-center justify-center gap-2">
                  Reset password
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-center text-sm">
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
