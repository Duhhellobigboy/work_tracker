import Head from 'next/head'
import DashboardLayout from '../components/layout/DashboardLayout'
import ProfileForm from '../components/profile/ProfileForm'

export default function ProfilePage({ session }) {
  // If the _app route guard catches an unauthenticated state, it handles the redirect.
  // We can render a fallback temporarily on the off-chance it ticks here before routing safely.
  if (!session) return null

  return (
    <DashboardLayout session={session}>
      <Head>
        <title>Account Settings | Task Manager</title>
      </Head>

      <div className="mb-6 flex items-start justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Account Profile</h1>
          <p className="text-gray-500 text-sm">Manage your personal settings and identity properties</p>
        </div>
      </div>

      <ProfileForm session={session} />
      
    </DashboardLayout>
  )
}
