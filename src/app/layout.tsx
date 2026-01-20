import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorker from "@/components/ui/ServiceWorker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Taha's general use job tracker",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
