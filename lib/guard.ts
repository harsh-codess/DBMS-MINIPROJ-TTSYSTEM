import { auth } from "@clerk/nextjs/server";

export async function requireAdmin() {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }
}
