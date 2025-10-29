import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ConnectWalletTopRight } from "@/components/ConnectWalletTopRight";

export const metadata: Metadata = {
  title: "City Guard Link",
  description: "Privacy-Preserving Report System with FHE",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="cityguard-bg text-foreground antialiased">
        <div className="fixed inset-0 w-full h-full cityguard-bg z-[-20]"></div>
        <Providers>
          <header className="header">
            <div className="header-content">
              <div className="header-left">
                <div className="logo">
                  <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12L3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="8" r="2" fill="currentColor"/>
                  </svg>
                  <h1 className="header-title">City Guard Link</h1>
                </div>
                <p className="header-subtitle">Privacy-Preserving Report System with FHE</p>
              </div>
              <div className="header-right">
                <ConnectWalletTopRight />
              </div>
            </div>
          </header>
          <main className="app-card">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
