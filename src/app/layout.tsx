import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/shared/AuthProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "EaseMyPrompt.ai",
  description: "Engineer Prompts Like a Pro.",
};

// Script runs synchronously before paint — prevents flash of wrong theme
const themeScript = `
  try {
    var t = localStorage.getItem('emp-theme');
    if (t === 'light') document.documentElement.classList.add('light-theme');
  } catch(e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Blocking script prevents FOUC */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ transition: "background-color 0.3s ease, color 0.3s ease" }}
      >
        <AuthProvider>{children}</AuthProvider>
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '12px', opacity: 0.6, zIndex: 9999, pointerEvents: 'none' }}>
          Built by Aryan
        </div>
      </body>
    </html>
  );
}
