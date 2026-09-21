import { AppShell } from "@/components/app-shell";
import { asHours } from "@/lib/db";
import { HoursBar, MetricCard } from "@/components/ui";
import { getDashboardStats, listFacultyLoads, listRooms } from "@/lib/queries";
import { GenerateButton } from "@/components/generate-button";
import { generateTimetableAction } from "@/lib/actions";
import Link from "next/link";

export default async function DashboardPage() {
  const [stats, faculty, rooms] = await Promise.all([
    getDashboardStats(),
    listFacultyLoads(),
    listRooms(),
  ]);

  return (
    <AppShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Faculty"
          value={String(stats.faculty)}
          hint="On CSE Semester 5"
        />
        <MetricCard
          label="Rooms"
          value={String(stats.rooms)}
          hint="Classrooms and labs"
        />
        <MetricCard
          label="Assigned hours"
          value={asHours(stats.assigned_hours)}
          hint={`${stats.assignments} teaching rows`}
        />
        <MetricCard
          label="Placed cells"
          value={String(stats.placed)}
          hint="Timetable entries"
        />
      </div>

      <div className="mt-6">
        <GenerateButton
          action={generateTimetableAction}
          hasExisting={stats.placed > 0}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-[0_0_0_1px_#E8E8E8]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Faculty load</h2>
            <Link href="/app/faculty" className="text-[13px] text-[#6B6B6B]">
              All faculty
            </Link>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="text-[#8A8A8A]">
              <tr>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Window</th>
                <th className="pb-3 font-medium">Theory</th>
                <th className="pb-3 font-medium">Practical</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((row) => (
                <tr key={row.faculty_id} className="border-t border-[#F0F0F0]">
                  <td className="py-3 font-medium">{row.full_name}</td>
                  <td className="py-3 text-[#6B6B6B]">{row.duty_window}</td>
                  <td className="py-3">
                    <HoursBar used={row.assigned_theory_hours} max={row.max_theory_hours} />
                  </td>
                  <td className="py-3">
                    <HoursBar
                      used={row.assigned_practical_hours}
                      max={row.max_practical_hours}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_0_0_1px_#E8E8E8]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Rooms</h2>
            <Link href="/app/rooms" className="text-[13px] text-[#6B6B6B]">
              All rooms
            </Link>
          </div>
          <ul className="divide-y divide-[#F0F0F0]">
            {rooms.map((room) => (
              <li key={room.id} className="flex items-center justify-between py-3 text-[13px]">
                <div>
                  <p className="font-medium">{room.code}</p>
                  <p className="text-[#8A8A8A]">
                    {room.kind}
                    {room.lab_type ? ` · ${room.lab_type}` : ""} · {room.capacity} seats
                  </p>
                </div>
                <span className="rounded-full bg-[#F5F5F5] px-2 py-1 text-[11px] uppercase tracking-wide text-[#6B6B6B]">
                  {room.kind}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
