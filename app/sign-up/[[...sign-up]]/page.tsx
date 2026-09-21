import { ClerkLoaded, ClerkLoading, SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5] text-[#111]">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-[13px] tracking-[0.18em]">
          PANELGRID
        </Link>
        <Link href="/sign-in" className="text-[13px] text-[#6B6B6B]">
          Already have the admin login
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <ClerkLoading>
          <p className="text-sm text-[#8A8A8A]">Loading sign up…</p>
        </ClerkLoading>
        <ClerkLoaded>
          <SignUp forceRedirectUrl="/app" signInUrl="/sign-in" />
        </ClerkLoaded>
      </main>
    </div>
  );
}
