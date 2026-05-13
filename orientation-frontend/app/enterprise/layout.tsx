"use client"

import { usePathname } from "next/navigation"
import EnterpriseNavbar from "../layouts/EnterpriseNavbar"

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage =
    pathname === "/enterprise/login" ||
    pathname === "/enterprise/register" ||
    pathname.startsWith("/enterprise/login/") ||
    pathname.startsWith("/enterprise/register/")

  if (isAuthPage) {
    return <>{children}</>
  }


  return (
    <>
      <EnterpriseNavbar />
      <main className="min-h-screen w-full pt-16">
        {children}
      </main>
    </>
  )
}
