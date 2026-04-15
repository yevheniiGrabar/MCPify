import { useCurrentUser } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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

/* ─── Schemas ─── */
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

export function SettingsPage() {
  const { data: user } = useCurrentUser()

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <ProfileSection user={user} />
      <Separator />
      <PasswordSection />
      <Separator />
      <TeamSection user={user} />
      <Separator />
      <DangerZone />
    </div>
  )
}

/* ─── Profile ─── */
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <CardTitle className="text-base">Profile</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!isDirty || saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
            >
              {saving ? 'Saving...' : <><Check className="w-3.5 h-3.5" /> Save changes</>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/* ─── Password ─── */
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-gray-400" />
          <CardTitle className="text-base">Change Password</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input id="current_password" type="password" placeholder="••••••••" {...register('current_password')} />
            {errors.current_password && <p className="text-xs text-red-500">{errors.current_password.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input id="new_password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input id="confirm_password" type="password" placeholder="••••••••" {...register('password_confirmation')} />
              {errors.password_confirmation && <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/* ─── Team ─── */
function TeamSection({ user }: { user: ReturnType<typeof useCurrentUser>['data'] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <CardTitle className="text-base">Team</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user?.current_team?.name ?? 'Personal workspace'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.current_team?.slug
                ? `Slug: ${user.current_team.slug}`
                : 'Default team for your account'}
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            Manage team
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Danger Zone ─── */
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
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete account</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently delete your account and all data. This cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account,
                  all services, tools, and analytics data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
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
      </CardContent>
    </Card>
  )
}
