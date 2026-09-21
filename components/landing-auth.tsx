import { Show } from "@clerk/nextjs";
import {
  SignedInHero,
  SignedInNav,
  SignedOutHero,
  SignedOutNav,
} from "./auth-controls";

export function LandingAuth() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignedOutNav />
      </Show>
      <Show when="signed-in">
        <SignedInNav />
      </Show>
    </div>
  );
}

export function HeroCta() {
  return (
    <>
      <Show when="signed-out">
        <SignedOutHero />
      </Show>
      <Show when="signed-in">
        <SignedInHero />
      </Show>
    </>
  );
}
