"use client";

import { useMemo, useState } from "react";
import { createAssignment } from "@/lib/actions";
import { btnInk, Field, inputClass } from "./ui";
import type { FacultyRow, LabBatchRow, PanelRow, SubjectRow } from "@/lib/queries";

export function AssignmentForm({
  faculty,
  subjects,
  panels,
  batches,
}: {
  faculty: FacultyRow[];
  subjects: SubjectRow[];
  panels: PanelRow[];
  batches: LabBatchRow[];
}) {
  const [subjectId, setSubjectId] = useState(subjects[0] ? String(subjects[0].id) : "");
  const [panelId, setPanelId] = useState(panels[0] ? String(panels[0].id) : "");

  const subject = subjects.find((s) => String(s.id) === subjectId);
  const practical = subject?.kind === "practical";
  const panelBatches = useMemo(
    () => batches.filter((b) => String(b.panel_id) === panelId),
    [batches, panelId],
  );

  return (
    <form action={createAssignment} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="Faculty">
        <select name="faculty_id" className={inputClass} required defaultValue={faculty[0]?.id}>
          {faculty.map((row) => (
            <option key={row.id} value={row.id}>
              {row.full_name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Subject">
        <select
          name="subject_id"
          className={inputClass}
          required
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          {subjects.map((row) => (
            <option key={row.id} value={row.id}>
              {row.code} · {row.kind}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Panel">
        <select
          name="panel_id"
          className={inputClass}
          required
          value={panelId}
          onChange={(e) => setPanelId(e.target.value)}
        >
          {panels.map((row) => (
            <option key={row.id} value={row.id}>
              {row.code}
            </option>
          ))}
        </select>
      </Field>
      <Field label={practical ? "Lab batch" : "Lab batch (theory: none)"}>
        <select
          name="lab_batch_id"
          className={inputClass}
          required={practical}
          defaultValue=""
        >
          <option value="">{practical ? "Choose batch" : "Whole panel"}</option>
          {panelBatches.map((row) => (
            <option key={row.id} value={row.id}>
              {row.code}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Hours / week">
        <input
          name="weekly_hours"
          type="number"
          min="0.5"
          step="0.5"
          required
          defaultValue="2"
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2 lg:col-span-5">
        <button type="submit" className={btnInk}>
          Add assignment
        </button>
      </div>
    </form>
  );
}
