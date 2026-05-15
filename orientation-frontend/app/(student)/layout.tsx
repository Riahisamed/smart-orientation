import StudentNavbar from "../layouts/StudentNavbar"
import FloatingAIChat from "../components/FloatingAIChat"
import StudentRouteGuard from "../components/StudentRouteGuard"
import HomeButton from "../components/navigation/HomeButton"
import DashboardButton from "../components/navigation/DashboardButton"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentRouteGuard>
      <StudentNavbar />
      <main className="min-h-screen w-full pt-16">
        {children}
      </main>
      {/* Fixed navigation buttons - bottom-left for quick access */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2">
        <HomeButton compact />
        <DashboardButton compact />
      </div>
      <FloatingAIChat />
    </StudentRouteGuard>
  )
}
