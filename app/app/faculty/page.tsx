import { AppShell } from "@/components/app-shell";
import { btnGhost, btnInk, Field, Flash, HoursBar, inputClass } from "@/components/ui";
import { createFaculty, deleteFaculty } from "@/lib/actions";
import { listDutyWindows, listFacultyLoads } from "@/lib/queries";
import Link from "next/link";

export default async function FacultyPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const [faculty, windows] = await Promise.all([
    listFacultyLoads(),
    listDutyWindows(),
  ]);

  return (
    <AppShell title="Faculty">
      <div className="space-y-4">
        <Flash message={flash.ok} />
        <Flash message={flash.error} tone="err" />
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_#E8E8E8]">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[#8A8A8A]">
            <tr className="border-b border-[#F0F0F0]">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Duty window</th>
              <th className="px-5 py-3 font-medium">Theory</th>
              <th className="px-5 py-3 font-medium">Practical</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {faculty.map((row) => (
              <tr key={row.faculty_id} className="border-b border-[#F0F0F0] last:border-0">
                <td className="px-5 py-3 font-medium">{row.full_name}</td>
                <td className="px-5 py-3 text-[#6B6B6B]">{row.duty_window}</td>
                <td className="px-5 py-3">
                  <HoursBar used={row.assigned_theory_hours} max={row.max_theory_hours} />
                </td>
                <td className="px-5 py-3">
                  <HoursBar
                    used={row.assigned_practical_hours}
                    max={row.max_practical_hours}
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/app/faculty/${row.faculty_id}`} className={btnGhost}>
                      Edit
                    </Link>
                    <form action={deleteFaculty}>
                      <input type="hidden" name="id" value={row.faculty_id} />
                      <button type="submit" className={btnGhost}>
                        Remove
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_0_0_1px_#E8E8E8]">
        <h2 className="text-[16px] font-semibold">Add faculty</h2>
        <p className="mt-1 text-[13px] text-[#8A8A8A]">
          Hours are weekly caps. Shamala is 4 theory + 8 practical on 09–16.
        </p>
        <form action={createFaculty} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Full name">
            <input name="full_name" required className={inputClass} placeholder="Shamala Patil" />
          </Field>
          <Field label="Duty window">
            <select name="duty_window_id" className={inputClass} required>
              {windows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Max theory hours">
            <input
              name="max_theory_hours"
              type="number"
              min="0"
              step="0.5"
              required
              defaultValue="4"
              className={inputClass}
            />
          </Field>
          <Field label="Max practical hours">
            <input
              name="max_practical_hours"
              type="number"
              min="0"
              step="0.5"
              required
              defaultValue="8"
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" className={btnInk}>
              Add faculty
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
