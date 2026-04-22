"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

type Props = {
  children?: ReactNode
}

export function SessionProviderWrapper({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>
}
