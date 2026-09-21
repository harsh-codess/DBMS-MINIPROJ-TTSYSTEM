import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PanelGrid — Timetable Studio",
  description:
    "Clash-free weekly timetables for faculty, panels, and rooms. One admin login for the coordinator.",
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#111111",
    colorText: "#111111",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#111111",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-jakarta)",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className={`${jakarta.className} min-h-full`}>
        <ClerkProvider
          appearance={clerkAppearance}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/app"
          signUpFallbackRedirectUrl="/app"
          afterSignOutUrl="/"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
