import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Culto — Private Creative Network",
  description: "An invite-only community for creators, designers, and artists. No algorithm. Chronological feed.",
  openGraph: {
    title: "Culto",
    description: "An invite-only creative network. By invitation only.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-cream text-ink font-mono antialiased min-h-screen">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
