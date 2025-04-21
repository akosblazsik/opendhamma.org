// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Analytics } from '@vercel/analytics/next';
import { GeistSans as Geist, GeistMono as Geist_Mono } from 'geist/font';
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "Opendhamma",
  description: "AI-enhanced wisdom architecture for dharmic teachings",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Apply font variables to the html tag
  return (
    <html lang="en" className={`${Geist.variable} ${Geist_Mono.variable} antialiased`}>
      <body> {/* Body gets base bg/color from globals.css */}
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        <Analytics />
      </body>
    </html>
  );
}