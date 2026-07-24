import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

// Authenticated application layout — shared shell for every authenticated route.
// Desktop: Sidebar (fixed) + TopBar (sticky) + scrollable main content
// Mobile:  TopBar (sticky) + scrollable main content + BottomNav (fixed)
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ══════════════════════════════════════════
          Desktop / Tablet shell  (md and above)
          Fixed sidebar + sticky top bar + scrollable content area
      ══════════════════════════════════════════ */}
      <div className="hidden md:flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          Mobile shell  (below md)
          Sticky top header + flex-1 scroll area + fixed bottom nav.
          Uses flex-col so TopBar always stays at the top and content
          scrolls independently between the two fixed bars.
      ══════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-900">
        {/* Sticky top header — same TopBar component, responsive internally */}
        <TopBar />

        {/* Scrollable page content */}
        {/* pb = 64px (BottomNav h-16) + 24px clearance + safe-area */}
        <main
          className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-900 px-4 pt-4"
          style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}
        >
          {children}
        </main>
      </div>

      {/* Fixed bottom nav — rendered outside both shells so it floats above both */}
      <BottomNav />
    </>
  );
}
