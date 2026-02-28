import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResRes — Restaurant Reservations",
  description: "Discover restaurants and reserve your perfect table",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f0a1a] min-h-screen antialiased">{children}</body>
    </html>
  );
}
