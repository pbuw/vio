import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Vio",
  description: "Deine Zusatzversicherung. Einfach genutzt. Dein praktischer Gesundheits-Begleiter.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="light" style={{ colorScheme: 'light' }}>
      <body
        className={`${poppins.variable} ${inter.variable} antialiased bg-[#F9FAFC] text-[#2D3436]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
