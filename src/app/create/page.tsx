import type { Metadata } from "next";
import { Suspense } from "react";
import CreateFlow from "@/components/CreateFlow";

export const metadata: Metadata = {
  title: "Write a letter",
  description:
    "Write your partner a private five-page letter with your own photographs, music and words, and send it as one secret link.",
  robots: { index: false, follow: true },
};

export default function CreatePage() {
  return (
    <Suspense fallback={<main style={{ padding: "var(--margin)" }}>Loading…</main>}>
      <CreateFlow />
    </Suspense>
  );
}
