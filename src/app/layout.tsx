import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { ProtectionInit } from "@/components/shared/ProtectionInit";

export const metadata: Metadata = {
  title: "EaseMyPrompt.ai — Engineer Prompts Like a Pro",
  description: "Turn any idea into a precision-crafted AI prompt in seconds. Derek is your always-on AI prompt engineer.",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;1,14..32,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        <AuthProvider>{children}</AuthProvider>
        <ProtectionInit />
      </body>
    </html>
  );
}
