import { useCurrentUser } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Check, Key, Shield, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import client from '@/api/client'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'New password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

const inputCls = 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-brand-500'
const labelCls = 'text-zinc-300 text-sm'

export function SettingsPage() {
  const { data: user } = useCurrentUser()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your account and preferences</p>
      </div>

      <ProfileSection user={user} />
      <PasswordSection />
      <TeamSection user={user} />
      <DangerZone />
    </div>
  )
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-surface-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-zinc-800">
        {icon}
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function ProfileSection({ user }: { user: ReturnType<typeof useCurrentUser>['data'] }) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  })

  const onSubmit = async (data: ProfileData) => {
    setSaving(true)
    try {
      await client.patch('/api/v1/auth/profile', data)
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard icon={<User className="w-4 h-4 text-brand-400" />} title="Profile">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className={labelCls}>Name</Label>
            <Input id="name" className={inputCls} {...register('name')} />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className={labelCls}>Email</Label>
            <Input id="email" type="email" className={inputCls} {...register('email')} />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!isDirty || saving}
            className="bg-brand-600 hover:bg-brand-500 text-white gap-1.5 shadow-lg shadow-brand-600/20"
          >
            {saving ? 'Saving...' : <><Check className="w-3.5 h-3.5" /> Save changes</>}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

function PasswordSection() {
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  const onSubmit = async (data: PasswordData) => {
    setSaving(true)
    try {
      await client.put('/api/v1/auth/password', data)
      toast.success('Password updated')
      reset()
    } catch {
      toast.error('Failed to update password — check your current password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard icon={<Key className="w-4 h-4 text-amber-400" />} title="Change Password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current_password" className={labelCls}>Current Password</Label>
          <Input
            id="current_password"
            type="password"
            placeholder="••••••••"
            className={inputCls}
            {...register('current_password')}
          />
          {errors.current_password && (
            <p className="text-xs text-red-400">{errors.current_password.message}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new_password" className={labelCls}>New Password</Label>
            <Input
              id="new_password"
              type="password"
              placeholder="••••••••"
              className={inputCls}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password" className={labelCls}>Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="••••••••"
              className={inputCls}
              {...register('password_confirmation')}
            />
            {errors.password_confirmation && (
              <p className="text-xs text-red-400">{errors.password_confirmation.message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={saving}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            {saving ? 'Updating...' : 'Update password'}
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}

function TeamSection({ user }: { user: ReturnType<typeof useCurrentUser>['data'] }) {
  return (
    <SectionCard icon={<Shield className="w-4 h-4 text-violet-400" />} title="Team">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">
            {user?.current_team?.name ?? 'Personal workspace'}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {user?.current_team?.slug
              ? `Slug: ${user.current_team.slug}`
              : 'Default team for your account'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="border-zinc-700 text-zinc-500"
        >
          Manage team
        </Button>
      </div>
    </SectionCard>
  )
}

function DangerZone() {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await client.delete('/api/v1/auth/account')
      localStorage.removeItem('auth_token')
      window.location.href = '/'
    } catch {
      toast.error('Failed to delete account')
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl border border-red-500/20 bg-surface-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-red-500/20">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Delete account</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Permanently delete your account and all data. This cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-surface-card border-zinc-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  This action cannot be undone. This will permanently delete your account,
                  all services, tools, and analytics data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-500 text-white"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, delete my account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
