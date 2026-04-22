import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-xl shadow-slate-300/20 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Orientation IA</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Register or sign in</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Use the login page to access the dashboard and calculator tools.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Link href="/login" className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
              Go to Login
            </Link>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
              <p className="font-semibold">Need to create an account?</p>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                The login page supports registration mode directly, so you can switch to sign up once there.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
