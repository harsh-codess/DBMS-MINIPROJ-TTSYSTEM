import { AppShell } from "@/components/app-shell";
import { AssignmentForm } from "@/components/assignment-form";
import { btnGhost, Flash } from "@/components/ui";
import { deleteAssignment } from "@/lib/actions";
import { asHours } from "@/lib/db";
import {
  listAssignments,
  listFaculty,
  listLabBatches,
  listPanels,
  listSubjects,
} from "@/lib/queries";

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const [assignments, faculty, subjects, panels, batches] = await Promise.all([
    listAssignments(),
    listFaculty(),
    listSubjects(),
    listPanels(),
    listLabBatches(),
  ]);

  return (
    <AppShell title="Assignments">
      <div className="space-y-4">
        <Flash message={flash.ok} />
        <Flash message={flash.error} tone="err" />
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_#E8E8E8]">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[#8A8A8A]">
            <tr className="border-b border-[#F0F0F0]">
              <th className="px-5 py-3 font-medium">Faculty</th>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Panel</th>
              <th className="px-5 py-3 font-medium">Hours</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {assignments.map((row) => (
              <tr key={row.id} className="border-b border-[#F0F0F0] last:border-0">
                <td className="px-5 py-3 font-medium">{row.faculty_name}</td>
                <td className="px-5 py-3">
                  {row.subject_code}
                  <span className="ml-2 text-[#8A8A8A]">{row.subject_kind}</span>
                </td>
                <td className="px-5 py-3 text-[#6B6B6B]">
                  {row.panel_code}
                  {row.lab_batch_code ? ` · ${row.lab_batch_code}` : ""}
                </td>
                <td className="px-5 py-3 tabular-nums">{asHours(row.weekly_hours)}</td>
                <td className="px-5 py-3">
                  <form action={deleteAssignment} className="flex justify-end">
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className={btnGhost}>
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_0_0_1px_#E8E8E8]">
        <h2 className="text-[16px] font-semibold">Add assignment</h2>
        <p className="mt-1 text-[13px] text-[#8A8A8A]">
          Theory belongs to a whole panel. Practicals belong to a lab batch under that panel.
        </p>
        <div className="mt-5">
          <AssignmentForm
            faculty={faculty}
            subjects={subjects}
            panels={panels}
            batches={batches}
          />
        </div>
      </section>
    </AppShell>
  );
}
