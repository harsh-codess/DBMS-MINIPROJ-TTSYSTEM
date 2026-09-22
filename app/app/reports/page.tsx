import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import { getDashboardStats } from "@/lib/queries";

export default async function ReportsPage() {
  const stats = await getDashboardStats();
  const hasEntries = stats.placed > 0;

  const reports = [
    {
      title: "Faculty Timetable",
      description: "Printable Mon–Sat weekly grid for each faculty member.",
      href: "/app/reports/faculty",
    },
    {
      title: "Panel Timetable",
      description: "Printable weekly grid for each student panel and lab batch.",
      href: "/app/reports/panel",
    },
    {
      title: "Room Occupancy",
      description: "Printable occupancy schedule for classrooms and labs.",
      href: "/app/reports/room",
    },
    {
      title: "Workload vs Scheduled",
      description: "Compare assigned theory and practical hours against actually placed timetable entries.",
      href: "/app/reports/workload",
    },
  ];

  return (
    <AppShell title="Reports">
      {!hasEntries && (
        <div className="mb-6 rounded-xl bg-[#FFF5F5] px-4 py-3 text-[13px] text-[#111] shadow-[0_0_0_1px_#FFD6D6]">
          <strong>Generate the week first.</strong> The timetable is currently empty. Reports will not show any placed classes until you generate the timetable.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-[0_0_0_1px_#E8E8E8] transition hover:shadow-[0_0_0_1px_#111]"
          >
            <h2 className="text-[16px] font-semibold">{r.title}</h2>
            <p className="text-[13px] text-[#6B6B6B]">{r.description}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
