import { AppShell } from "@/components/app-shell";
import { RoomFields } from "@/components/room-fields";
import { btnGhost, Flash } from "@/components/ui";
import { createRoom, deleteRoom } from "@/lib/actions";
import { listRooms } from "@/lib/queries";
import Link from "next/link";

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const rooms = await listRooms();

  return (
    <AppShell title="Rooms">
      <div className="space-y-4">
        <Flash message={flash.ok} />
        <Flash message={flash.error} tone="err" />
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_#E8E8E8]">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[#8A8A8A]">
            <tr className="border-b border-[#F0F0F0]">
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Kind</th>
              <th className="px-5 py-3 font-medium">Lab type</th>
              <th className="px-5 py-3 font-medium">Capacity</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-[#F0F0F0] last:border-0">
                <td className="px-5 py-3 font-medium">{room.code}</td>
                <td className="px-5 py-3 capitalize">{room.kind}</td>
                <td className="px-5 py-3 text-[#6B6B6B]">{room.lab_type ?? "—"}</td>
                <td className="px-5 py-3">{room.capacity}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/app/rooms/${room.id}`} className={btnGhost}>
                      Edit
                    </Link>
                    <form action={deleteRoom}>
                      <input type="hidden" name="id" value={room.id} />
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
        <h2 className="text-[16px] font-semibold">Add room</h2>
        <p className="mt-1 text-[13px] text-[#8A8A8A]">
          Classrooms have no lab type. Labs need a type such as programming.
        </p>
        <form action={createRoom} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RoomFields />
        </form>
      </section>
    </AppShell>
  );
}
