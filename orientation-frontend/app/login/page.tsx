"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Chrome } from "lucide-react"
import Link from "next/link"
import { API_BASE_URL } from "@/lib/api/config"

export default function AuthPage() {

  const router = useRouter()
  const { data: session, status } = useSession()

  const [mode, setMode] = useState<"login" | "register">("login")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "loading") return
    if (session) {
      router.push("/auth/callback")
    }
  }, [session, status, router])

  // ================= LOGIN =================
  const login = async () => {

    setError("")

    if (!email || !password) {
      setError("Fill all fields")
      return
    }

    try {

      setLoading(true)

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      
      if (!res.ok) {
        setError(data.message || "Login failed")
        return
      }

      // save token
localStorage.setItem("token", data.access_token)
localStorage.setItem("email", email)

// 🔥 هذا الجديد

      // redirect
if (data.user.role === "ADMIN") {
  router.push("/admin")
} else {
  router.push("/dashboard")
}

    } catch (err) {
      console.error(err)
      setError("Server error")
    } finally {
      setLoading(false)
    }

  }

  // ================= GOOGLE LOGIN =================
  const handleGoogleSignIn = () => {
    signIn("google", {
      callbackUrl: "/auth/callback",
      prompt: "select_account consent",
    })
  }

  // ================= REGISTER =================
  const register = async () => {

    setError("")

    if (!email || !password || !confirmPassword) {
      setError("Fill all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {

      setLoading(true)

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Register failed")
        return
      }

      setMode("login")
      setError("Account created, login now")

    } catch (err) {
      console.error(err)
      setError("Server error")
    } finally {
      setLoading(false)
    }

  }

  return (

    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center">

        <Card className="w-full rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-300/20 dark:border-slate-800 dark:bg-slate-900/95">

          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-3xl text-slate-900 dark:text-slate-100">
              {mode === "login" ? "Welcome Back" : "Create Your Account"}
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Welcome back! Please enter your details."
                : "Create your account to continue."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300">{error}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                className="rounded-xl"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                className="rounded-xl"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />

              {mode === "login" && (
                <Link
                  href="/forgot-password"
                  className="block text-right text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="rounded-xl"
                  placeholder="Confirm Password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {mode === "login" && (
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-900 dark:border-slate-600 dark:bg-slate-900" />
                Remember me
              </label>
            )}

            <Button
              disabled={loading}
              onClick={mode === "login" ? login : register}
              className="h-11 w-full rounded-xl"
            >
              {loading
                ? "Loading..."
                : mode === "login"
                  ? "SIGN IN"
                  : "SIGN UP"}
            </Button>

            {mode === "login" && (
              <>
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <span className="relative mx-auto block w-fit bg-white px-2 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/90 dark:text-slate-400">
                    Or continue with
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="h-11 w-full rounded-xl gap-2"
                >
                  <Chrome className="h-4 w-4" />
                  Sign in with Google
                </Button>
              </>
            )}

          </CardContent>

          <CardFooter className="justify-center pt-1">
            {mode === "login" ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Sign in
                </button>
              </p>
            )}
          </CardFooter>

        </Card>

      </div>

    </div>

  )
}
