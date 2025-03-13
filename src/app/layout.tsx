import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crypto Mining Game",
  description: "A crypto mining clicker game for Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Telegram Mini App initialization script - must be in head before other scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js?56"></script>
      </head>
      <body className={inter.className}>
        <div className="telegram-app">{children}</div>
      </body>
    </html>
  );
}
