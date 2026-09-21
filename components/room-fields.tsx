"use client";

import { useState } from "react";
import { btnInk, Field, inputClass } from "./ui";

type RoomValues = {
  code?: string;
  kind?: "classroom" | "lab";
  lab_type?: string | null;
  capacity?: number;
};

export function RoomFields({ room }: { room?: RoomValues }) {
  const [kind, setKind] = useState<"classroom" | "lab">(room?.kind ?? "classroom");

  return (
    <>
      <Field label="Code">
        <input
          name="code"
          required
          defaultValue={room?.code ?? ""}
          placeholder="R-204"
          className={inputClass}
        />
      </Field>
      <Field label="Kind">
        <select
          name="kind"
          className={inputClass}
          value={kind}
          onChange={(e) => setKind(e.target.value as "classroom" | "lab")}
        >
          <option value="classroom">Classroom</option>
          <option value="lab">Lab</option>
        </select>
      </Field>
      <Field label="Lab type">
        <input
          name="lab_type"
          className={inputClass}
          disabled={kind !== "lab"}
          required={kind === "lab"}
          defaultValue={room?.lab_type ?? ""}
          placeholder={kind === "lab" ? "programming" : "Not used for classrooms"}
        />
      </Field>
      <Field label="Capacity">
        <input
          name="capacity"
          type="number"
          min="1"
          required
          defaultValue={room?.capacity ?? 30}
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2 lg:col-span-4">
        <button type="submit" className={btnInk}>
          {room ? "Save room" : "Add room"}
        </button>
      </div>
    </>
  );
}
