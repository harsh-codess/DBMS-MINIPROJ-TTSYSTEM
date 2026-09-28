"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function keepOpen() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] text-[#111]">
      <div className="relative z-20 w-[72px] shrink-0 print:hidden">
        <aside
          className={`absolute inset-y-0 left-0 flex flex-col border-r border-[#E8E8E8] bg-white py-5 transition-[width,padding] duration-200 ${
            open ? "w-[220px] items-stretch px-3" : "w-[72px] items-center"
          }`}
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleClose}
          onFocusCapture={keepOpen}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              scheduleClose();
            }
          }}
        >
          <Link
            href="/app"
            className={`mb-8 flex h-10 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#111] text-white ${
              open ? "w-full px-3" : "w-10"
            }`}
            aria-label="PanelGrid overview"
          >
            <span className="text-sm font-semibold tracking-tight">P</span>
            {open ? (
              <span className="text-[13px] font-medium tracking-[0.12em]">PANELGRID</span>
            ) : null}
          </Link>
          <nav className={`flex flex-1 flex-col gap-2 ${open ? "items-stretch" : "items-center"}`}>
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
                  className={`flex h-11 items-center overflow-hidden rounded-xl transition ${
                    open ? "w-full justify-start gap-3 px-3" : "w-11 justify-center"
                  } ${
                    active
                      ? "bg-[#111] text-white"
                      : "text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#111]"
                  }`}
                >
                  <Icon />
                  {open ? (
                    <span className="whitespace-nowrap text-[13px] font-medium">{item.label}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>

      <div
        className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-200 ${
          open ? "pl-[148px]" : "pl-0"
        }`}
      >
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 print:hidden">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A8A8A]">
              PanelGrid
            </p>
            <h1 className="truncate text-[17px] font-semibold leading-none tracking-tight">
              {title}
            </h1>
          </div>
          <AppUserMenu />
        </header>
        <main className="@container min-w-0 flex-1 px-4 pb-10 sm:px-6 lg:px-8 print:px-0 print:pb-0">
          {children}
        </main>
      </div>
    </div>
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
