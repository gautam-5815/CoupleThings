import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import EnvelopeAddress from "@/components/EnvelopeAddress";
import ExperiencePreview from "@/components/ExperiencePreview";
import { pictures, allPictures } from "@/lib/credits";
import { site } from "@/lib/site";

const itinerary = [
  {
    when: "First",
    rows: [
      ["Say who it is for", "30 sec"],
      ["Choose the occasion", "30 sec"],
    ],
  },
  {
    when: "Then",
    rows: [
      ["Write the five pages", "4 min"],
      ["Add your photographs", "1 min"],
      ["Choose a song per page", "1 min"],
    ],
  },
  {
    when: "Last",
    rows: [
      ["Read it through", "1 min"],
      ["Copy the private link", "10 sec"],
    ],
  },
];

const menu = [
  {
    group: "On every page",
    items: [
      ["Your own words", "yours", "Write them, or start from a draft and change every line."],
      ["A photograph", "any size", "From your phone. Reordered by dragging."],
      ["A song", "per page", "Your own file, or one from the free library."],
    ],
  },
  {
    group: "The last page",
    items: [
      ["Your question", "your words", "Whatever you actually want to ask them."],
      ["Yes", "a celebration", "Their answer opens the last screen, with your photographs."],
      ["Not yet", "a real answer", "The second button works. It is never a trick."],
    ],
  },
  {
    group: "When you send it",
    items: [
      ["A private link", "unguessable", "A long random address that only you have."],
      ["Search engines", "kept out", "Every letter carries noindex and is in no sitemap."],
      ["Their account", "not needed", "They open the link and read it. That is all."],
      ["Deleting it", "any time", "The letter and its photographs go with it."],
    ],
  },
];

const faqs = [
  ["Is it really free?", "Yes. There is no subscription, no premium template and no payment page anywhere in it. It runs on free infrastructure, so there are sensible limits on photograph size and how many letters one person can make in a day."],
  ["Do I need an account?", "No. You write the letter and keep the link. Keep a copy of that link somewhere safe, because it is how you edit or delete the letter later."],
  ["Does my partner need one?", "No. They open the link and read it. Nothing is asked of them."],
  ["Can anyone else find it?", "Not through searching. Every letter has a long random address, carries a noindex instruction and is left out of the sitemap. Anyone you send the link to can open it, so send it to one person."],
  ["Can I use my own photographs?", "Yes, that is the point. They are stored with the letter and deleted with it."],
  ["What music can I use?", "Your own files, or tracks from the free library. Please do not upload commercial songs you do not have the right to share."],
  ["Does the No button trap them?", "No. It moves aside once, playfully, and then it works. A letter that will not accept an honest answer is not worth sending."],
  ["Can I change it after sending?", "Yes, from the same link you saved. The address stays the same, so what you already sent keeps working."],
  ["Do I have to use the writing help?", "No. Every page can be written from scratch, and the help only ever rearranges what you have already told it. It will not invent memories you did not mention."],
  ["Can I delete it?", "Yes, at any time, and the photographs go with it."],
];

export default function Home() {
  return (
    <>
      <JsonLd />

      {/* ============ HERO — the object, over a pinned dim ground ============ */}
      <section
        style={{ position: "relative", background: "var(--field-dark)", color: "var(--field-dark-ink)" }}
      >
        {/* the ground is what holds its place; the letter scrolls over it,
            so no text is ever covered */}
        <div style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden", zIndex: 0 }}>
          <Image
            src={pictures.hummingbird.src}
            alt={pictures.hummingbird.alt}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", filter: "brightness(0.42)" }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: "-100svh",
            minHeight: "100svh",
            display: "grid",
            placeItems: "center",
            paddingInline: "var(--margin)",
            paddingBlock: "clamp(1.5rem, 4vw, 3rem)",
          }}
        >
            {/* the envelope */}
            <div
              className="sheet"
              style={{
                width: "min(100%, 46rem)",
                padding: "clamp(1.4rem, 3vw, 2.75rem)",
                display: "grid",
                gap: "clamp(1rem, 2vw, 1.6rem)",
              }}
            >
              <h1 className="head" style={{ maxWidth: "22ch" }}>
                A letter only one person opens.
              </h1>

              <p style={{ maxWidth: "42ch" }}>
                Five pages of photographs, music and your own words, sent to your partner as a
                single private link.
              </p>

              <EnvelopeAddress />

              {/* the wordmark, spread along the bottom edge of the object */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  fontSize: "var(--step-body)",
                }}
              >
                <span>Couple</span>
                <span className="ink-muted" style={{ fontWeight: 400 }}>
                  Free, no account
                </span>
                <span>Things</span>
              </div>
          </div>
        </div>

        {/* the plates that pass over the held ground */}
        <div
          className="field-dark"
          style={{
            position: "relative",
            zIndex: 2,
            paddingBlock: "clamp(4rem, 7vw, 7rem)",
          }}
        >
          <div className="wrap" style={{ display: "grid", gap: "clamp(3rem, 7vw, 7rem)" }}>
            <Reveal>
              <h2 className="head" style={{ maxWidth: "18ch" }}>
                Two hundred years of letters.
              </h2>
            </Reveal>

            <div
              style={{
                display: "grid",
                gap: "clamp(2rem, 5vw, 4rem)",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))",
                alignItems: "end",
              }}
            >
              {[pictures.loveMeOrIDie, pictures.sayShallIConquer, pictures.toMyDearValentine].map(
                (p, i) => (
                  <Reveal key={p.src} delay={i * 90}>
                    <figure style={{ margin: 0, display: "grid", gap: "0.9rem" }}>
                      <Image
                        src={p.src}
                        alt={p.alt}
                        width={p.width}
                        height={p.height}
                        sizes="(max-width: 768px) 90vw, 28vw"
                        style={{ width: "100%", height: "auto" }}
                      />
                      <figcaption className="small ink-muted">
                        {p.title}, {p.date}
                      </figcaption>
                    </figure>
                  </Reveal>
                ),
              )}
            </div>

            <Reveal delay={120}>
              <p className="lead" style={{ maxWidth: "46ch" }}>
                A valentine was one sheet, cut and pasted by hand, addressed to one person and
                given to them directly. This is that, with your photographs in it.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS — itinerary on a slip ============ */}
      <section
        id="how-it-works"
        style={{ paddingBlock: "var(--section-gap)", background: "var(--paper)" }}
      >
        <div
          className="wrap"
          style={{
            display: "grid",
            gap: "clamp(2.5rem, 6vw, 5rem)",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
            alignItems: "start",
          }}
        >
          <Reveal>
            <div style={{ display: "grid", gap: "1.5rem" }}>
              <h2 className="head">Written in six minutes.</h2>
              <p style={{ maxWidth: "var(--measure)" }}>
                Nothing to install, nothing to pay for, and no account to make. You leave with one
                link and nothing else.
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div
              className="slip-zigzag"
              style={{
                background: "var(--paper-step)",
                padding: "clamp(1.5rem, 3vw, 2.25rem)",
                paddingBottom: "clamp(2.5rem, 4vw, 3.25rem)",
                maxWidth: "30rem",
              }}
            >
              {itinerary.map((group, gi) => (
                <Reveal key={group.when} delay={gi * 80} className="slip-group">
                  <h3 style={{ fontSize: "var(--step-body)", fontWeight: 600, letterSpacing: 0 }}>
                    {group.when}
                  </h3>
                  <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.9rem" }}>
                    {group.rows.map(([what, time]) => (
                      <p key={what} className="leader">
                        <span>{what}</span>
                        <span className="leader-fill" aria-hidden="true" />
                        <span className="leader-value ink-muted">{time}</span>
                      </p>
                    ))}
                  </div>
                </Reveal>
              ))}

              <p
                className="leader"
                style={{
                  marginTop: "1.75rem",
                  background: "var(--ink)",
                  color: "var(--paper)",
                  padding: "0.7rem 1rem",
                  minHeight: "44px",
                }}
              >
                <span>One private link, in your hand</span>
                <span className="leader-fill" aria-hidden="true" />
                <span className="leader-value">6 min</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ SHOWCASE — square plate, spare text ============ */}
      <section id="what-they-open" className="field-rose" style={{ paddingBlock: "var(--section-gap)" }}>
        <div
          className="wrap"
          style={{
            display: "grid",
            gap: "clamp(2.5rem, 6vw, 5rem)",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
            alignItems: "center",
          }}
        >
          <Reveal>
            <ExperiencePreview />
          </Reveal>

          <Reveal delay={90}>
            <div style={{ display: "grid", gap: "2rem" }}>
              <h2 className="head">What they open.</h2>
              <p style={{ maxWidth: "var(--measure)" }}>
                Five pages, turned one at a time, each with its own photograph and its own song.
                The last one asks them something, and waits.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link className="btn" href="/create">
                  Write yours
                </Link>
                <Link className="btn btn-plain" href="/how-it-works">
                  See a whole letter
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FEATURES — capabilities as a menu ============ */}
      <section id="what-you-can-put-in" style={{ paddingBlock: "var(--section-gap)" }}>
        <div className="wrap" style={{ display: "grid", placeItems: "center" }}>
          <Reveal>
            <div
              className="sheet-scallop"
              style={{
                background: "var(--paper-step)",
                width: "min(100%, 38rem)",
                padding: "clamp(2.5rem, 5vw, 4rem) clamp(1.25rem, 3vw, 2.5rem)",
              }}
            >
              <h2 className="head" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                What you can put in.
              </h2>

              {menu.map((group, gi) => (
                <Reveal key={group.group} delay={gi * 80} className="menu-group">
                  <h3 style={{ fontSize: "var(--step-lead)", fontWeight: 600, letterSpacing: 0 }}>
                    {group.group}
                  </h3>
                  <div style={{ display: "grid", gap: "1.1rem", marginTop: "1.1rem" }}>
                    {group.items.map(([name, value, note]) => (
                      <div key={name}>
                        <p className="leader">
                          <span style={{ fontWeight: 500 }}>{name}</span>
                          <span className="leader-fill" aria-hidden="true" />
                          <span className="leader-value ink-muted">{value}</span>
                        </p>
                        <p className="small ink-muted" style={{ maxWidth: "34ch", marginTop: "0.2rem" }}>
                          {note}
                        </p>
                      </div>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FAQ — answers as reading text ============ */}
      <section id="questions" className="field-dark" style={{ paddingBlock: "var(--section-gap)" }}>
        <div className="wrap faq-grid">
          <Reveal>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              <h2 className="head">Questions.</h2>
              <p className="ink-muted" style={{ maxWidth: "26ch" }}>
                Everything answered at a glance, because you should know what you are sending
                before you send it.
              </p>
            </div>
          </Reveal>

          <Reveal delay={90} className="faq-columns">
            <div>
              {faqs.map(([q, a]) => (
                <p key={q} style={{ breakInside: "avoid", marginBottom: "1.25rem" }}>
                  <strong style={{ fontWeight: 500 }}>{q}</strong>{" "}
                  <span className="ink-muted">{a}</span>
                </p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ CTA — one word is the button ============ */}
      <Link
        href="/create"
        aria-label="Write your letter"
        style={{
          display: "block",
          position: "relative",
          background: "var(--accent)",
          color: "var(--accent-ink)",
          minHeight: "60svh",
          textDecoration: "none",
          paddingInline: "var(--margin)",
          paddingTop: "clamp(1.5rem, 4vw, 3rem)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "2rem" }}>
          <span style={{ maxWidth: "26ch" }}>
            Takes about six minutes. You leave with one private link.
          </span>
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" fill="none">
            <path d="M12 36L36 12M36 12H16M36 12V32" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>
        <span
          style={{
            position: "absolute",
            left: "var(--margin)",
            right: "var(--margin)",
            bottom: "24px",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            letterSpacing: "-0.05em",
            lineHeight: 0.8,
            fontSize: "min(26vw, 22rem)",
          }}
        >
          Write
        </span>
      </Link>

      {/* ============ FOOTER — photograph half, menu half ============ */}
      <footer style={{ background: "var(--paper)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
            minHeight: "100svh",
          }}
        >
          <div style={{ position: "relative", minHeight: "50svh" }}>
            <Image
              src={pictures.billetDoux.src}
              alt={pictures.billetDoux.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>

          <div
            style={{
              padding: "clamp(2rem, 5vw, 5rem) var(--margin)",
              display: "grid",
              alignContent: "space-between",
              gap: "3rem",
            }}
          >
            <div>
              <p style={{ fontWeight: 600, marginBottom: "2.5rem" }}>{site.name}</p>
              <nav style={{ display: "grid", gap: "1.25rem" }}>
                {[
                  ["How it works", "/how-it-works"],
                  ["Apology letters", "/apology-website"],
                  ["Anniversaries", "/anniversary-website"],
                  ["Love letters", "/love-letter"],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      fontSize: "clamp(1.5rem, 2.6vw, 2.2rem)",
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      textDecoration: "none",
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            <div style={{ display: "grid", gap: "1.5rem" }}>
              <p className="small ink-muted" style={{ maxWidth: "60ch" }}>
                Pictures on this page are Victorian valentines and love letters from the Art
                Institute of Chicago, all public domain (CC0), and none of them shows this service
                or anyone who uses it:{" "}
                {allPictures.map((p, i) => (
                  <span key={p.src}>
                    <a href={p.page} rel="noopener">
                      {p.title}
                    </a>
                    {p.creator ? `, ${p.creator}` : ""}, {p.date}
                    {i < allPictures.length - 1 ? "; " : "."}
                  </span>
                ))}
              </p>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <Link className="small" href="/privacy">
                  Privacy
                </Link>
                <Link className="small" href="/terms">
                  Terms
                </Link>
              </div>
              <p className="small ink-muted">
                {site.name}. Free to use. Your letters are yours and are never indexed.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function JsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      description: site.description,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: site.name,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any",
      url: site.url,
      description: site.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
