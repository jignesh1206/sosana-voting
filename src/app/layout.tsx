import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { StaticProvider } from "@/context/StaticContext";
import WalletContextProvider from "@/context/WalletContextProvider";
import { StoreProvider } from "@/store/Provider";
import Header from "@/components/header";
import Polyfills from "@/components/Polyfills";
import {
  FaTelegram,
  FaYoutube,
  FaTwitter,
  FaFacebook,
  FaDiscord,
} from "react-icons/fa";

export const metadata: Metadata = {
  title: "SOSANA VOTING",
  description: "Vote for your favorite Solana tokens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <StoreProvider>
          <WalletContextProvider>
            <StaticProvider>
              <Polyfills />
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8 mt-2">
                  {children}
                </main>
              <footer className="bg-secondary/80 backdrop-blur-md py-4 text-center text-sm border-t border-card-border">
                <p>&copy; 2025 Sosana Token Voting. All rights reserved.</p>
                <div className="flex justify-center space-x-4 mt-2">
                  <a
                    href="https://x.com/sosanatoken"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                  >
                    <FaTwitter
                      size={24}
                      className="text-accent hover:text-accent/80 transition-colors"
                    />
                  </a>
                  <a
                    href="https://t.me/SosanaToken"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                  >
                    <FaTelegram
                      size={24}
                      className="text-accent hover:text-accent/80 transition-colors"
                    />
                  </a>
                  <a
                    href="https://discord.gg/ssbSwD3T"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Discord"
                  >
                    <FaDiscord
                      size={24}
                      className="text-accent hover:text-accent/80 transition-colors"
                    />
                  </a>
                  <a
                    href="https://www.youtube.com/@SOSANAtoken"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                  >
                    <FaYoutube
                      size={24}
                      className="text-accent hover:text-accent/80 transition-colors"
                    />
                  </a>
                  <a
                    href="https://www.facebook.com/groups/sosana"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <FaFacebook
                      size={24}
                      className="text-accent hover:text-accent/80 transition-colors"
                    />
                  </a>
                </div>
              </footer>
            </div>
          </StaticProvider>
        </WalletContextProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
