"use client";

import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

const ghost =
  "inline-flex h-9 items-center rounded-full border border-white/70 px-4 text-[13px] font-medium text-white transition hover:bg-white hover:text-[#111]";
const solid =
  "inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-medium text-[#111] transition hover:bg-[#f5f5f5]";
const hero =
  "inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-[#111] transition hover:bg-[#f5f5f5]";

export function SignedOutNav() {
  return (
    <>
      <SignInButton mode="redirect" forceRedirectUrl="/app">
        <button type="button" className={ghost}>
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="redirect" forceRedirectUrl="/app">
        <button type="button" className={solid}>
          Sign up
        </button>
      </SignUpButton>
    </>
  );
}

export function SignedInNav() {
  return (
    <>
      <Link href="/app" className={solid}>
        Open studio
      </Link>
      <UserButton />
    </>
  );
}

export function SignedOutHero() {
  return (
    <SignInButton mode="redirect" forceRedirectUrl="/app">
      <button type="button" className={hero}>
        Open as admin
      </button>
    </SignInButton>
  );
}

export function SignedInHero() {
  return (
    <Link href="/app" className={hero}>
      Open studio
    </Link>
  );
}

export function AppUserMenu() {
  return <UserButton />;
}
