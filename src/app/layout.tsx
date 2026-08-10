import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Frame in Goa — Hacker House Goa 2026",
  description:
    "Upload a photo and get an instant, on-brand Hacker House Goa 2026 graphic. Download it or share to X. #FrameInGoa",
  openGraph: {
    title: "Frame in Goa — Hacker House Goa 2026",
    description:
      "Upload a photo, get an instant HH Goa 2026 graphic, share to X. #FrameInGoa",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#160e2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
