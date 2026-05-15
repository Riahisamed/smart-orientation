"use client"

import { usePathname } from "next/navigation"
import EnterpriseNavbar from "../layouts/EnterpriseNavbar"
import HomeButton from "../components/navigation/HomeButton"
import DashboardButton from "../components/navigation/DashboardButton"

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
      {/* Fixed navigation buttons - bottom-left for quick access */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2">
        <HomeButton compact />
        <DashboardButton compact />
      </div>
    </>
  )
}
