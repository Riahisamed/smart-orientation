"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (installEvent: Event) => {
      installEvent.preventDefault()
      setEvent(installEvent as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const install = async () => {
    if (!event) return
    await event.prompt()
    await event.userChoice
    setVisible(false)
    setEvent(null)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 font-black text-white">SO</div>
          <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Installer Smart Orientation</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Acces rapide et pages essentielles hors ligne.</p>
          </div>
        </div>
        <button onClick={install} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
          <Download className="h-4 w-4" />
          Installer
        </button>
      </div>
    </div>
  )
}
