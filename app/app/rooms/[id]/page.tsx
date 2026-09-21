import { AppShell } from "@/components/app-shell";
import { RoomFields } from "@/components/room-fields";
import { btnGhost, Flash } from "@/components/ui";
import { deleteRoom, updateRoom } from "@/lib/actions";
import { getRoom } from "@/lib/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function RoomEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const room = await getRoom(Number(id));
  if (!room) notFound();

  return (
    <AppShell title={room.code}>
      <Flash message={flash.error} tone="err" />
      <section className="mt-4 max-w-2xl rounded-2xl bg-white p-5 shadow-[0_0_0_1px_#E8E8E8]">
        <form action={updateRoom} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={room.id} />
          <RoomFields room={room} />
        </form>
        <div className="mt-4">
          <Link href="/app/rooms" className={btnGhost}>
            Back
          </Link>
        </div>
        <form action={deleteRoom} className="mt-8 border-t border-[#F0F0F0] pt-5">
          <input type="hidden" name="id" value={room.id} />
          <button type="submit" className={btnGhost}>
            Remove room
          </button>
        </form>
      </section>
    </AppShell>
  );
}
