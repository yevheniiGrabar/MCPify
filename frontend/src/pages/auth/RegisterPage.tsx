import { useRegister } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const register_ = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    register_.mutate(data, {
      onSuccess: () => void navigate('/dashboard'),
      onError: () => toast.error('Registration failed. Please try again.'),
    })
  }

  return (
    <div className="min-h-screen bg-surface flex relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-brand-600/8 rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[120px]" />

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <div className="max-w-md px-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="flex items-center gap-2.5 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">MCPify</span>
            </Link>

            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
              Start building AI-ready APIs today
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              Create your free account and connect your first API in under 5 minutes.
            </p>

            <div className="space-y-4">
              {[
                'Free plan — no credit card required',
                '1 service + 1,000 calls/month included',
                'Go live in under 5 minutes',
                'Works with any REST API or framework',
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-zinc-300 text-sm">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MCPify</span>
          </Link>

          <div className="rounded-2xl border border-zinc-800 bg-surface-card p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Create an account</h1>
              <p className="text-zinc-400 text-sm">Start building AI-ready APIs today</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300 text-sm">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-brand-500 focus:ring-brand-500/20"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

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
                <Label htmlFor="password" className="text-zinc-300 text-sm">Password</Label>
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
                disabled={register_.isPending}
              >
                {register_.isPending ? 'Creating account...' : (
                  <span className="flex items-center justify-center gap-2">
                    Create account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-center text-sm text-zinc-400">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
