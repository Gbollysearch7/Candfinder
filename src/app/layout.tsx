import type { Metadata } from "next";
import { Poppins, JetBrains_Mono, Syne } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talist — AI-Powered Candidate Sourcing",
  description: "Find and enrich candidate profiles using natural language search powered by Exa Websets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${syne.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        {/* Background blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(18, 18, 20, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#e4e4e7",
            },
          }}
        />
      </body>
    </html>
  );
}
