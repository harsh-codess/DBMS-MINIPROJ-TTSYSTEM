import { AppShell } from "@/components/app-shell";
import { btnGhost, btnInk, Field, Flash, inputClass } from "@/components/ui";
import { deleteFaculty, updateFaculty } from "@/lib/actions";
import { getFaculty, listDutyWindows } from "@/lib/queries";
import { asHours } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function FacultyEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const facultyId = Number(id);
  const [faculty, windows] = await Promise.all([
    getFaculty(facultyId),
    listDutyWindows(),
  ]);
  if (!faculty) notFound();

  return (
    <AppShell title={faculty.full_name}>
      <Flash message={flash.error} tone="err" />
      <section className="mt-4 max-w-2xl rounded-2xl bg-white p-5 shadow-[0_0_0_1px_#E8E8E8]">
        <form action={updateFaculty} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={faculty.id} />
          <Field label="Full name">
            <input
              name="full_name"
              required
              defaultValue={faculty.full_name}
              className={inputClass}
            />
          </Field>
          <Field label="Duty window">
            <select
              name="duty_window_id"
              className={inputClass}
              defaultValue={faculty.duty_window_id}
            >
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
              defaultValue={asHours(faculty.max_theory_hours)}
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
              defaultValue={asHours(faculty.max_practical_hours)}
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className={btnInk}>
              Save
            </button>
            <Link href="/app/faculty" className={btnGhost}>
              Back
            </Link>
          </div>
        </form>
        <form action={deleteFaculty} className="mt-8 border-t border-[#F0F0F0] pt-5">
          <input type="hidden" name="id" value={faculty.id} />
          <button type="submit" className={btnGhost}>
            Remove faculty
          </button>
        </form>
      </section>
    </AppShell>
  );
}
