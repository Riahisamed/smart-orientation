import StudentNavbar from "../layouts/StudentNavbar"
import FloatingAIChat from "../components/FloatingAIChat"
import StudentRouteGuard from "../components/StudentRouteGuard"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentRouteGuard>
      <StudentNavbar />
      <main className="min-h-screen w-full pt-16">
        {children}
      </main>
      <FloatingAIChat />
    </StudentRouteGuard>
  )
}
