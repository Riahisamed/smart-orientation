import { Home } from "lucide-react"
import Link from "next/link"

interface HomeButtonProps {
  className?: string
  compact?: boolean
}

export default function HomeButton({ className = "", compact = false }: HomeButtonProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 rounded-xl bg-white/80 dark:bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl dark:text-slate-300 dark:hover:bg-slate-900 ${className}`}
      aria-label="Back to home"
    >
      <Home className="h-4 w-4" />
      {!compact && <span className="hidden sm:inline">Accueil</span>}
    </Link>
  )
}