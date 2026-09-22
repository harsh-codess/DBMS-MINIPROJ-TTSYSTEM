"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppUserMenu } from "./auth-controls";

const nav = [
  { href: "/app", label: "Overview", icon: OverviewIcon },
  { href: "/app/timetable", label: "Timetable", icon: TimetableIcon },
  { href: "/app/faculty", label: "Faculty", icon: FacultyIcon },
  { href: "/app/rooms", label: "Rooms", icon: RoomIcon },
  { href: "/app/assignments", label: "Assignments", icon: AssignIcon },
  { href: "/app/reports", label: "Reports", icon: ReportIcon },
];

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] text-[#111]">
      <aside className="flex w-[72px] shrink-0 flex-col items-center border-r border-[#E8E8E8] bg-white py-5 print:hidden">
        <Link
          href="/app"
          className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-[#111] text-white"
          aria-label="PanelGrid overview"
        >
          <span className="text-sm font-semibold tracking-tight">P</span>
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-2">
          {nav.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                  active
                    ? "bg-[#111] text-white"
                    : "text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#111]"
                }`}
              >
                <Icon />
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between px-8 print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#111] shadow-[0_0_0_1px_#E8E8E8]">
              <MenuIcon />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A8A8A]">
                PanelGrid
              </p>
              <h1 className="text-[17px] font-semibold leading-none tracking-tight">
                {title}
              </h1>
            </div>
          </div>
          <AppUserMenu />
        </header>
        <main className="flex-1 px-8 pb-10 print:px-0 print:pb-0">{children}</main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 4.5h10M3 8h10M3 11.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="2.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="10" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="10" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function FacultyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.2 14.2c.8-2.4 2.5-3.6 4.8-3.6s4 1.2 4.8 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function RoomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3.5 15V7.2L9 3.5l5.5 3.7V15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.2 15v-4.2h3.6V15" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function AssignIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 7.2h6M6 9.4h6M6 11.6h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TimetableIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.5" y="3.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 7h13M7 7v7.5M11 7v7.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4.5 3h6l4.5 4.5v7.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 013 15V4.5A1.5 1.5 0 014.5 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10.5 3v4.5H15M6.5 10.5h5M6.5 13h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
