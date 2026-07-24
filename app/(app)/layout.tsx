import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { getSession } from "@/lib/auth";
import { getImpersonationDetails, stopImpersonation } from "@/lib/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = session?.role || 'USER';
  const user = session ? { fullName: session.fullName, email: session.email } : null;
  const impersonatedUser = await getImpersonationDetails();

  // Banner height in pixels — used to offset fixed elements below it
  const bannerH = impersonatedUser ? 36 : 0;

  return (
    <>
      {/* ══════════════════════════════════════════
          Impersonation Banner — fixed strip at the very top
      ══════════════════════════════════════════ */}
      {impersonatedUser && (
        <div
          className="fixed top-0 left-0 right-0 z-[9999] h-9 bg-amber-600 text-white px-4 text-center text-sm font-semibold flex items-center justify-center gap-2"
        >
          <span>Viewing system as <strong>{impersonatedUser.fullName} ({impersonatedUser.email})</strong></span>
          <form action={async () => {
            'use server';
            await stopImpersonation();
          }} className="inline">
            <button type="submit" className="underline font-bold hover:text-amber-200 transition-colors ml-2 cursor-pointer">
              Exit Impersonation
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DESKTOP shell — md and above
          ┌─────────────────────────────────────┐
          │  Fixed Sidebar  │  Fixed TopBar      │
          │                 │───────────────────-│
          │                 │  Scrollable Main   │
          │                 │                    │
          └─────────────────────────────────────┘
          The sidebar is position:fixed inside Sidebar component.
          The right panel fills the remaining width with ml-56 (sidebar width).
          TopBar is sticky within the right panel flex column.
          Main overflows with overflow-y-auto.
      ══════════════════════════════════════════ */}
      <div
        className="hidden md:flex"
        style={{
          position: 'fixed',
          top: `${bannerH}px`,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        {/* Fixed Sidebar (internally uses position:fixed, emits spacer div for layout flow) */}
        <Sidebar role={role} user={user} bannerOffset={`${bannerH}px`} />

        {/* Right panel: TopBar (sticky) + scrollable content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar role={role} user={user} />
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE shell — below md
          No sidebar. Topbar at top, BottomNav pinned at bottom.
          Page scrolls between them.
      ══════════════════════════════════════════ */}
      <div
        className="md:hidden flex flex-col bg-slate-50 dark:bg-zinc-900"
        style={{
          position: 'fixed',
          top: `${bannerH}px`,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        <TopBar role={role} user={user} />
        <main
          className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-900 px-4 pt-4"
          style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}
        >
          {children}
        </main>
      </div>

      {/* Fixed bottom nav for mobile — always on top */}
      <BottomNav role={role} />
    </>
  );
}
