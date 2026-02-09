import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AG-Grid Views Manager",
  description: "Next.js + Supabase AG-Grid views management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
