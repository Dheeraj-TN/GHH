import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { exists } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const base = await baseUrl();
  const imgUrl = `${base}/api/img/${id}`;
  const title = "HACKER HOUSE GOA 2026 — I'm in 🌴";
  const description = `Made my HH Goa 2026 graphic. ${BRAND.hashtag}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imgUrl, width: 1080, height: 1080, alt: "HH Goa 2026 graphic" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imgUrl],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ok = await exists(id);
  const base = await baseUrl();
  const imgUrl = `${base}/api/img/${id}`;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "radial-gradient(120% 100% at 50% 0%, #3b2470 0%, #160e2e 60%)",
        color: BRAND.colors.cream,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        {ok ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt="HH Goa 2026 graphic"
            style={{
              width: "min(88vw, 460px)",
              borderRadius: 24,
              boxShadow: "0 24px 80px rgba(0,0,0,.5)",
            }}
          />
        ) : (
          <p style={{ opacity: 0.8 }}>This graphic has expired or was not found.</p>
        )}
        <h1 style={{ marginTop: 22, fontSize: 26, fontWeight: 800 }}>
          Hacker House Goa 2026
        </h1>
        <p style={{ opacity: 0.75, marginTop: 6 }}>{BRAND.hashtag}</p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "12px 22px",
            borderRadius: 999,
            fontWeight: 700,
            color: "#160e2e",
            background: "linear-gradient(90deg,#FFD84D,#FF6B4A,#FF2E7E)",
            textDecoration: "none",
          }}
        >
          Make your own →
        </Link>
      </div>
    </main>
  );
}
