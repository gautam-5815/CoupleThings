import type { Metadata } from "next";
import { Suspense } from "react";
import LetterReader from "@/components/LetterReader";

/**
 * A private letter. Never indexed, never in the sitemap, and the social
 * preview deliberately says nothing about what is inside it.
 */
export const metadata: Metadata = {
  title: "A letter for you",
  description: "Someone wrote you something private.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  openGraph: {
    title: "A letter for you",
    description: "Someone wrote you something private.",
  },
};

export default function LetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main style={{ padding: "var(--margin)" }}>Opening the letter…</main>}>
      <Resolve params={params} />
    </Suspense>
  );
}

async function Resolve({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LetterReader id={id} />;
}
