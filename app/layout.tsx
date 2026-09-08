import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "convexa.app";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Convexa — Enquanto você trabalha, a gente atende";
  const description = "Atendimento e agendamento inteligente pelo WhatsApp para negócios que trabalham com hora marcada.";
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Convexa — atendimento inteligente via WhatsApp" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
